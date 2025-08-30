import { z } from "zod";
import type { Request, Response } from "express";
import type { AuthedRequest } from "../auth/middleware";
import { query, begin, commit, rollback } from "../db";

/** ---------- Schemas ---------- */

const IdParam = z.object({
  id: z.uuid(),
});

const ActivitiesQuery = z.object({
  property_id: z.uuid().optional(),
  type: z.string().min(1).optional(), // e.g., 'water', 'land', 'wellness'
});

const SessionsQuery = z.object({
  from: z.iso.datetime().optional(),
  to: z.iso.datetime().optional(),
});

const CreateBookingSchema = z.object({
  session_id: z.uuid(),
  // Optional: if you want age/waiver acknowledgement in request body
  participant_age: z.number().int().min(0).optional(),
  acknowledged_waiver: z.boolean().optional(),
});

/** ---------- GET /activities ---------- */
export async function listActivities(req: Request, res: Response) {
  try {
    const parsed = ActivitiesQuery.safeParse(req.query);
    if (!parsed.success)
      return res.status(422).json({ error: z.treeifyError(parsed.error) });

    const { property_id, type } = parsed.data;
    const sql = `
      SELECT
        a.id, a.property_id, a.name, a.type, a.description, a.duration_mins, a.image_url,
        a.base_price, a.min_age, a.requires_waiver, a.created_at
      FROM activities a
      WHERE (:p1::uuid IS NULL OR a.property_id = :p1::uuid)
        AND (:p2::text IS NULL OR a.type = :p2::text)
      ORDER BY a.type, a.name
    `;
    const { rows } = await query(sql, [
      { name: "p1", value: property_id ?? null },
      { name: "p2", value: type ?? null },
    ]);
    return res.json({ data: rows });
  } catch (e: any) {
    return res.status(500).json({ error: { message: e.message } });
  }
}

/** ---------- GET /activities/:id/sessions ---------- */
export async function listSessions(req: Request, res: Response) {
  try {
    const { id } = req.params; // activity_id
    const parsed = SessionsQuery.safeParse(req.query);
    if (!parsed.success)
      return res.status(422).json({ error: z.treeifyError(parsed.error) });

    const { from, to } = parsed.data;

    const sql = `
      SELECT
        s.id, s.activity_id, s.start_ts, s.end_ts, s.capacity, s.price_override,
        COALESCE(
          (SELECT SUM(b.guests)::int
           FROM activity_bookings b
           WHERE b.session_id = s.id
             AND b.status IN ('pending','confirmed')), 0
        ) AS booked_count
      FROM activity_sessions s
      WHERE s.activity_id = :aid::uuid
        AND (:from::timestamptz IS NULL OR s.start_ts >= :from::timestamptz)
        AND (:to::timestamptz IS NULL OR s.start_ts <= :to::timestamptz)
      ORDER BY s.start_ts
    `;
    const { rows } = await query(sql, [
      { name: "aid", value: id },
      { name: "from", value: from ?? null },
      { name: "to", value: to ?? null },
    ]);
    return res.json({ data: rows });
  } catch (e: any) {
    return res.status(500).json({ error: { message: e.message } });
  }
}

/** ---------- POST /activities/:id/bookings (auth) ---------- */
export async function createBooking(req: AuthedRequest, res: Response) {
  // params.id is activity_id; body contains session_id and optional fields
  const parsed = CreateBookingSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(422).json({ error: z.treeifyError(parsed.error) });

  const { id: activity_id } = req.params;
  const { session_id, participant_age, acknowledged_waiver } = parsed.data;
  const user_id = req.user!.id;

  // Start a transaction to lock capacity safely
  const tx = await begin();
  try {
    // 1) Lock the session row and join activity to validate relationship + rules
    const { rows: sessionRows } = await query<{
      id: string;
      activity_id: string;
      start_ts: string;
      end_ts: string;
      capacity: number;
      price_override: string | null;
      base_price: string;
      min_age: number | null;
      requires_waiver: boolean;
    }>(
      `
      SELECT
        s.id, s.activity_id, s.start_ts, s.end_ts, s.capacity, s.price_override,
        a.base_price, a.min_age, a.requires_waiver
      FROM activity_sessions s
      JOIN activities a ON a.id = s.activity_id
      WHERE s.id = :sid::uuid
        AND s.activity_id = :aid::uuid
      FOR UPDATE
      `,
      [
        { name: "sid", value: session_id },
        { name: "aid", value: activity_id },
      ],
      tx
    );

    const session = sessionRows[0];
    if (!session) {
      await rollback(tx);
      return res
        .status(404)
        .json({ error: { message: "Activity or session not found" } });
    }

    // 2) Capacity check (count current non-canceled bookings for this session)
    const { rows: capRows } = await query<{ c: string }>(
      `
     SELECT COALESCE(SUM(guests), 0)::int AS c
FROM activity_bookings
WHERE session_id = :sid::uuid
  AND status IN ('pending','confirmed');
      `,
      [{ name: "sid", value: session_id }],
      tx
    );
    const booked = Number(capRows[0].c);
    if (booked >= session.capacity) {
      await rollback(tx);
      return res.status(409).json({ error: { message: "Session full" } });
    }

    // 3) Minimum age check (if provided in activity and request has participant_age)
    if (session.min_age != null && participant_age != null) {
      if (participant_age < session.min_age) {
        await rollback(tx);
        return res.status(422).json({
          error: { message: `Minimum age is ${session.min_age}` },
        });
      }
    }
    // If you want to hard-require participant_age when min_age is set, enforce here:
    // if (session.min_age != null && participant_age == null) { ... }

    // 4) Waiver check (if activity requires it and not acknowledged)
    if (session.requires_waiver && !acknowledged_waiver) {
      await rollback(tx);
      return res
        .status(422)
        .json({ error: { message: "Waiver must be acknowledged" } });
    }

    // 5) Price calculation (override > base)
    const price = Number(session.price_override ?? session.base_price);

    const total = price;

    // 6) Create booking as pending
    const { rows: bookingRows } = await query<{ id: string }>(
      `
      INSERT INTO activity_bookings
        (activity_id, session_id, user_id, status, total, payment_status, created_at)
      VALUES
        (:aid::uuid, :sid::uuid, :uid::uuid, 'pending', :total, 'unpaid', now())
      RETURNING id
      `,
      [
        { name: "aid", value: activity_id },
        { name: "sid", value: session_id },
        { name: "uid", value: user_id },
        { name: "total", value: total },
      ],
      tx
    );

    await commit(tx);

    return res.status(201).json({
      booking: {
        id: bookingRows[0].id,
        status: "pending",
        price,
        session_id,
        activity_id,
      },
    });
  } catch (e: any) {
    await rollback(tx);
    return res.status(500).json({ error: { message: e.message } });
  }
}

/** ---------- GET /activity-bookings (mine) ---------- */
export async function listMyActivityBookings(
  req: AuthedRequest,
  res: Response
) {
  try {
    const { rows } = await query<any>(
      `
      SELECT
        b.id,
        b.status,
        b.payment_status,
        b.total AS price,
        b.created_at,
        s.start_ts,
        s.end_ts,
        a.id AS activity_id,
        a.name AS activity_name,
        a.type AS activity_type,
        a.requires_waiver
      FROM activity_bookings b
      JOIN activity_sessions s ON s.id = b.session_id
      JOIN activities a ON a.id = b.activity_id
      WHERE b.user_id = :uid::uuid
      ORDER BY b.created_at DESC
      `,
      [{ name: "uid", value: req.user!.id }]
    );
    return res.json({ data: rows });
  } catch (e: any) {
    console.error("listMyActivityBookings error:", e);
    return res.status(500).json({ error: { message: e.message } });
  }
}

/** ---------- PUT /activity-bookings/:id/cancel (mine) ---------- */
export async function cancelMyActivityBooking(
  req: AuthedRequest,
  res: Response
) {
  try {
    const { id } = req.params;

    // Optional: prevent cancel if session already started; you can enforce with a join check
    const { rows } = await query<{ id: string }>(
      `
      UPDATE activity_bookings b
      SET status = 'canceled'
      WHERE b.id = :bid::uuid
        AND b.user_id = :uid::uuid
        AND b.status IN ('pending','confirmed')
      RETURNING b.id
      `,
      [
        { name: "bid", value: id },
        { name: "uid", value: req.user!.id },
      ]
    );

    if (!rows.length) {
      return res
        .status(404)
        .json({
          error: { message: "Booking not found or cannot be canceled" },
        });
    }

    return res.json({ ok: true, id: rows[0].id });
  } catch (e: any) {
    return res.status(500).json({ error: { message: e.message } });
  }
}

/** ---------- GET /activities/:id (details) ---------- */
export async function getActivityDetail(req: Request, res: Response) {
  const parsed = IdParam.safeParse(req.params);
  if (!parsed.success) {
    return res.status(422).json({ error: z.treeifyError(parsed.error) });
  }
  const { id } = parsed.data;

  try {
    const { rows } = await query<any>(
      `
      SELECT
        a.id,
        a.property_id,
        a.name,
        a.type,
        a.description,
        a.duration_mins,
        a.base_price,
        a.min_age,
        a.requires_waiver,
        a.image_url,
        a.created_at,
        -- how many future sessions are scheduled
        COALESCE((
          SELECT COUNT(*)
          FROM activity_sessions s
          WHERE s.activity_id = a.id
            AND s.start_ts >= NOW()
        ), 0) AS upcoming_sessions,
        -- the very next upcoming session (if any)
        (
          SELECT json_build_object(
            'id', s2.id,
            'start_ts', s2.start_ts,
            'end_ts', s2.end_ts,
            'capacity', s2.capacity,
            'price_override', s2.price_override
          )
          FROM activity_sessions s2
          WHERE s2.activity_id = a.id AND s2.start_ts >= NOW()
          ORDER BY s2.start_ts ASC
          LIMIT 1
        ) AS next_session
      FROM activities a
      WHERE a.id = :aid::uuid
      LIMIT 1
      `,
      [{ name: "aid", value: id }]
    );

    const activity = rows[0];
    if (!activity) {
      return res.status(404).json({ error: { message: "Activity not found" } });
    }
    return res.json({ activity });
  } catch (e: any) {
    return res.status(500).json({ error: { message: e.message } });
  }
}
