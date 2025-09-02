// src/admin/controller.ts
import { z } from "zod";
import type { Request, Response } from "express";
import { query } from "../db";

const PageQuery = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function listUsers(req: Request, res: Response) {
  const { limit, offset } = PageQuery.parse(req.query);
  const { rows } = await query(
    `SELECT id, email, name, role, created_at
     FROM users
     ORDER BY created_at DESC
     LIMIT :limit OFFSET :offset`,
    [{ name: "limit", value: limit }, { name: "offset", value: offset }]
  );
  res.json({ data: rows });
}

const RoleBody = z.object({ role: z.enum(["user", "staff", "admin"]) });

export async function setUserRole(req: Request, res: Response) {
  const { role } = RoleBody.parse(req.body);
  const id = z.uuid().parse(req.params.id);

  const { rows } = await query<{ id: string }>(
    `UPDATE users SET role = :role WHERE id = :id::uuid RETURNING id`,
    [{ name: "role", value: role }, { name: "id", value: id }]
  );

  if (!rows.length) {
    return res.status(404).json({ error: { message: "User not found" } });
  }
  res.json({ ok: true, id: rows[0].id, role });
}

export async function listAllOrders(req: Request, res: Response) {
  const { limit, offset } = PageQuery.parse(req.query);
  const { rows } = await query(
    `SELECT o.id, o.user_id, u.email, o.status, o.payment_status,
            o.subtotal, o.delivery_fee, o.total, o.created_at
     FROM orders o
     JOIN users u ON u.id = o.user_id
     ORDER BY o.created_at DESC
     LIMIT :limit OFFSET :offset`,
    [{ name: "limit", value: limit }, { name: "offset", value: offset }]
  );
  res.json({ data: rows });
}

export async function listAllReservations(req: Request, res: Response) {
  const { limit, offset } = PageQuery.parse(req.query);
  const { rows } = await query(
    `SELECT r.id, r.user_id, u.email, r.status, r.start_date, r.end_date, r.created_at
     FROM reservations r
     JOIN users u ON u.id = r.user_id
     ORDER BY r.created_at DESC
     LIMIT :limit OFFSET :offset`,
    [{ name: "limit", value: limit }, { name: "offset", value: offset }]
  );
  res.json({ data: rows });
}

export async function listAllBookings(req: Request, res: Response) {
  const PageQuery = z.object({
    limit: z.coerce.number().int().min(1).max(200).default(50),
    offset: z.coerce.number().int().min(0).default(0),
  });
  const { limit, offset } = PageQuery.parse(req.query);

  const { rows } = await query(
    `
    SELECT
      b.id,
      b.user_id,
      u.email,
      b.activity_id,
      a.name AS activity_name,
      b.session_id,
      s.start_ts,
      s.end_ts,
      b.guests,
      b.status,
      b.payment_status,
      b.total,
      b.created_at
    FROM activity_bookings b
    JOIN users u            ON u.id = b.user_id
    JOIN activities a       ON a.id = b.activity_id
    JOIN activity_sessions s ON s.id = b.session_id
    ORDER BY b.created_at DESC
    LIMIT :limit OFFSET :offset
    `,
    [{ name: "limit", value: limit }, { name: "offset", value: offset }]
  );

  res.json({ data: rows });
}