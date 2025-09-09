import { z } from "zod";
import type { Request, Response } from "express";
import type { AuthedRequest } from "../auth/middleware";
import { query, begin, commit, rollback } from "../db";

/* ───── Schemas ───── */

const ListRoomsQuery = z.object({
  property_id: z.uuid(),
  from: z.iso.date().optional(), // YYYY-MM-DD (inclusive)
  to: z.iso.date().optional(), // YYYY-MM-DD (exclusive end)
  min_capacity: z.coerce.number().int().min(1).optional(),
});

const CreateReservationSchema = z.object({
  room_id: z.uuid(),
  start_date: z.iso.date(),
  end_date: z.iso.date(), // exclusive end (checkout date)
});

const IdParam = z.object({ id: z.uuid() });

/* ───── Helpers ───── */

function nightsBetween(startISO: string, endISO: string) {
  const ms = Date.parse(endISO) - Date.parse(startISO);
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

// overlap if NOT (new_end <= existing.start OR new_start >= existing.end)
const OVERLAP = `
  NOT (
    :end::date   <= r.start_date
    OR
    :start::date >= r.end_date
  )
`;

/* ───── GET /api/v1/rooms ─────
   List rooms for a property; if from/to provided, return only those with no overlapping reservations.
*/
export async function listRooms(req: Request, res: Response) {
  const parsed = ListRoomsQuery.safeParse(req.query);
  if (!parsed.success)
    return res.status(422).json({ error: z.treeifyError(parsed.error) });

  const { property_id, from, to, min_capacity } = parsed.data;

  // If one of from/to is provided, require both (to avoid half-baked queries)
  if ((from && !to) || (!from && to)) {
    return res.status(422).json({
      error: { message: "Both from and to must be provided together" },
    });
  }
  if (from && to && nightsBetween(from, to) <= 0) {
    return res
      .status(422)
      .json({ error: { message: "end date must be after start date" } });
  }

  try {
    if (from && to) {
      // Availability filter: NOT EXISTS overlapping reservation
      const sql = `
  SELECT
    rm.id, rm.property_id, rm.name, rm.capacity, rm.price, rm.created_at, rm.image_url, rm.description
  FROM rooms rm
  WHERE rm.property_id = :pid::uuid
    AND (:mincap::int IS NULL OR rm.capacity >= :mincap::int)
    AND NOT EXISTS (
      SELECT 1
      FROM reservations r
      WHERE r.room_id = rm.id
        AND r.status IN ('pending','confirmed')
        AND ${OVERLAP}
    )
  ORDER BY rm.capacity, rm.price, rm.name
`;

      const { rows } = await query(sql, [
        { name: "pid", value: property_id },
        { name: "mincap", value: min_capacity ?? null },
        { name: "start", value: from },
        { name: "end", value: to },
      ]);
      // Optionally compute a preview total = nights * price (not stored)
      const nights = nightsBetween(from, to);
      const data = rows.map((r) => ({
        ...r,
        nights,
        est_total: (Number(r.price) * nights).toFixed(2),
      }));
      return res.json({ data, from, to, nights });
    } else {
      // No date filter → simple list
      const sql = `
        SELECT rm.id, rm.property_id, rm.name, rm.capacity, rm.price, rm.created_at, rm.image_url, rm.description
        FROM rooms rm
        WHERE rm.property_id = :pid::uuid
          AND (:mincap::int IS NULL OR rm.capacity >= :mincap::int)
        ORDER BY rm.capacity, rm.price, rm.name
      `;
      const { rows } = await query(sql, [
        { name: "pid", value: property_id },
        { name: "mincap", value: min_capacity ?? null },
      ]);
      return res.json({ data: rows });
    }
  } catch (e: any) {
    return res.status(500).json({ error: { message: e.message } });
  }
}

/* ───── POST /api/v1/reservations (auth) ─────
   Create reservation if room is available in [start_date, end_date)
*/
export async function createReservation(req: AuthedRequest, res: Response) {
  const parsed = CreateReservationSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(422).json({ error: z.treeifyError(parsed.error) });

  const { room_id, start_date, end_date } = parsed.data;
  if (nightsBetween(start_date, end_date) <= 0) {
    return res
      .status(422)
      .json({ error: { message: "end_date must be after start_date" } });
  }

  const user_id = req.user!.id;
  const tx = await begin();
  try {
    // 1) Lock the room row to prevent racey overlaps
    const { rows: roomRows } = await query<{
      id: string;
      property_id: string;
      price: string;
    }>(
      `SELECT id, property_id, price FROM rooms WHERE id = :rid::uuid FOR UPDATE`,
      [{ name: "rid", value: room_id }],
      tx
    );
    const room = roomRows[0];
    if (!room) {
      await rollback(tx);
      return res.status(404).json({ error: { message: "Room not found" } });
    }

    // 2) Check overlap inside the same transaction
    const { rows: ov } = await query<{ c: string }>(
      `
  SELECT COUNT(*)::int AS c
  FROM reservations r
  WHERE r.room_id = :rid::uuid
    AND r.status IN ('pending','confirmed')
    AND ${OVERLAP}
  `,
      [
        { name: "rid", value: room_id },
        { name: "start", value: start_date },
        { name: "end", value: end_date },
      ],
      tx
    );
    if (Number(ov[0].c) > 0) {
      await rollback(tx);
      return res
        .status(409)
        .json({ error: { message: "Room unavailable for those dates" } });
    }

    // 3) Compute total (not stored in DB; returned to client)
    const nights = nightsBetween(start_date, end_date);
    const est_total = Number(room.price) * nights;

    // 4) Insert reservation (pending)
    const { rows: ins } = await query<{ id: string }>(
      `
      INSERT INTO reservations
        (id, room_id, user_id, status, start_date, end_date, created_at)
      VALUES
        (gen_random_uuid(), :rid::uuid, :uid::uuid, 'pending', :sd::date, :ed::date, now())
      RETURNING id
      `,
      [
        { name: "rid", value: room_id },
        { name: "uid", value: user_id },
        { name: "sd", value: start_date },
        { name: "ed", value: end_date },
      ],
      tx
    );

    await commit(tx);
    return res.status(201).json({
      reservation: {
        id: ins[0].id,
        status: "pending",
        start_date,
        end_date,
        nights,
        est_total,
        room_id,
        property_id: room.property_id,
      },
    });
  } catch (e: any) {
    await rollback(tx);
    return res.status(500).json({ error: { message: e.message } });
  }
}

/* ───── GET /api/v1/reservations (mine) ───── */
export async function listMyReservations(req: AuthedRequest, res: Response) {
  try {
    const { rows } = await query<any>(
      `
      SELECT
        r.id, r.status, r.start_date, r.end_date, r.created_at,
        rm.id AS room_id, rm.name AS room_name, rm.capacity, rm.price,
        rm.property_id
      FROM reservations r
      JOIN rooms rm ON rm.id = r.room_id
      WHERE r.user_id = :uid::uuid
      ORDER BY r.created_at DESC
      `,
      [{ name: "uid", value: req.user!.id }]
    );

    // add est_total & nights on the fly
    const data = rows.map((row: any) => {
      const nights = nightsBetween(row.start_date, row.end_date);
      return {
        ...row,
        nights,
        est_total: (Number(row.price) * nights).toFixed(2),
      };
    });

    return res.json({ data });
  } catch (e: any) {
    return res.status(500).json({ error: { message: e.message } });
  }
}

/* ───── GET /api/v1/reservations/:id (mine) ───── */
export async function getMyReservation(req: AuthedRequest, res: Response) {
  const parsed = IdParam.safeParse(req.params);
  if (!parsed.success)
    return res.status(422).json({ error: z.treeifyError(parsed.error) });
  const { id } = parsed.data;

  try {
    const { rows } = await query<any>(
      `
      SELECT
        r.id, r.status, r.start_date, r.end_date, r.created_at,
        rm.id AS room_id, rm.name AS room_name, rm.capacity, rm.price,
        rm.property_id
      FROM reservations r
      JOIN rooms rm ON rm.id = r.room_id
      WHERE r.user_id = :uid::uuid
        AND r.id = :rid::uuid
      LIMIT 1
      `,
      [
        { name: "uid", value: req.user!.id },
        { name: "rid", value: id },
      ]
    );
    const row = rows[0];
    if (!row)
      return res
        .status(404)
        .json({ error: { message: "Reservation not found" } });

    const nights = nightsBetween(row.start_date, row.end_date);
    return res.json({
      reservation: {
        ...row,
        nights,
        est_total: (Number(row.price) * nights).toFixed(2),
      },
    });
  } catch (e: any) {
    return res.status(500).json({ error: { message: e.message } });
  }
}

/* ───── PUT /api/v1/reservations/:id/cancel (mine) ───── */
export async function cancelMyReservation(req: AuthedRequest, res: Response) {
  const parsed = IdParam.safeParse(req.params);
  if (!parsed.success)
    return res.status(422).json({ error: z.treeifyError(parsed.error) });
  const { id } = parsed.data;

  try {
    const { rows } = await query<{ id: string }>(
      `
      UPDATE reservations
      SET status = 'canceled'
      WHERE id = :rid::uuid
        AND user_id = :uid::uuid
        AND status IN ('pending','confirmed')
      RETURNING id
      `,
      [
        { name: "rid", value: id },
        { name: "uid", value: req.user!.id },
      ]
    );
    if (!rows.length) {
      return res.status(404).json({
        error: { message: "Reservation not found or cannot be canceled" },
      });
    }
    return res.json({ ok: true, id: rows[0].id });
  } catch (e: any) {
    return res.status(500).json({ error: { message: e.message } });
  }
}

export async function getRoom(req: Request, res: Response) {
  const parsed = IdParam.safeParse(req.params);
  if (!parsed.success)
    return res.status(422).json({ error: z.treeifyError(parsed.error) });
  const { id } = parsed.data;

  try {
    const { rows } = await query(
      `
      SELECT
        id, property_id, name, capacity, price, created_at, description
      FROM rooms
      WHERE id = :rid::uuid
      LIMIT 1
      `,
      [{ name: "rid", value: id }]
    );

    const room = rows[0];
    if (!room)
      return res.status(404).json({ error: { message: "Room not found" } });

    return res.json({ room });
  } catch (e: any) {
    return res.status(500).json({ error: { message: e.message } });
  }
}
