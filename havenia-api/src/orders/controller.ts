import { z } from "zod";
import type { Response } from "express";
import type { AuthedRequest } from "../auth/middleware";
import { query, begin, commit, rollback } from "../db";

// --- Validation (scheduled_ts optional ISO datetime)
const CreateOrderSchema = z
  .object({
    property_id: z.uuid().optional(),
    delivery_type: z.enum(["pickup", "delivery"]),
    address_id: z.uuid().optional(), // required if delivery
    scheduled_ts: z.iso.datetime().optional(),
    notes: z.string().max(2000).optional(),
    items: z
      .array(
        z.object({
          menu_item_id: z.uuid(),
          qty: z.number().int().min(1).max(99),
          notes: z.string().max(500).optional(),
        })
      )
      .min(1, "At least one item is required"),
  })
  .refine((v) => (v.delivery_type === "delivery" ? !!v.address_id : true), {
    message: "address_id is required for delivery",
    path: ["address_id"],
  });

// Build a named-params IN (...) clause for RDS Data API
function buildInParams<T extends string>(
  prefix: string,
  values: T[]
): { clause: string; params: Array<{ name: string; value: any }> } {
  const names: string[] = [];
  const params: Array<{ name: string; value: any }> = [];
  values.forEach((v, i) => {
    const n = `${prefix}${i}`;
    names.push(`:${n}::uuid`);
    params.push({ name: n, value: v });
  });
  return { clause: names.join(","), params };
}

// --- POST /api/v1/orders
export async function createOrder(req: AuthedRequest, res: Response) {
  const parsed = CreateOrderSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(422).json({ error: z.treeifyError(parsed.error) });

  const { property_id, delivery_type, address_id, scheduled_ts, notes, items } =
    parsed.data;
  const user_id = req.user!.id;

  // 1) De-duplicate items by menu_item_id and sum qtys
  const idToQty = new Map<string, number>();
  const idToNotes = new Map<string, string | undefined>();
  for (const it of items) {
    idToQty.set(it.menu_item_id, (idToQty.get(it.menu_item_id) || 0) + it.qty);
    if (it.notes) idToNotes.set(it.menu_item_id, it.notes);
  }
  const menuIds = [...idToQty.keys()];

  // 2) Fetch menu items (server-side price & stock)
  const inSql = buildInParams("m", menuIds);
  const menuSql = `
    SELECT id, name, price, in_stock
    FROM menu_items
    WHERE id IN (${inSql.clause})
  `;
  try {
    const { rows: menuRows } = await query<{
      id: string;
      name: string;
      price: string;
      in_stock: boolean;
    }>(menuSql, inSql.params);
    if (menuRows.length !== menuIds.length) {
      return res
        .status(400)
        .json({ error: { message: "One or more menu items not found" } });
    }

    // 3) Validate stock & compute totals (Data API returns numerics as strings)
    let subtotal = 0;
    for (const row of menuRows) {
      if (!row.in_stock) {
        return res
          .status(409)
          .json({ error: { message: `Item out of stock: ${row.name}` } });
      }
      const qty = idToQty.get(row.id)!;
      const unit = Number(row.price);
      subtotal += unit * qty;
    }

    // Basic fees/discounts (tweak later)
    const delivery_fee = delivery_type === "delivery" ? 50 : 0;
    const discount = 0;
    const total = subtotal + delivery_fee - discount;

    // 4) Transaction: insert order, then items
    const tx = await begin();
    try {
      const { rows: orderRows } = await query<{ id: string }>(
        `INSERT INTO orders
         (user_id, property_id, status, delivery_type, address_id, scheduled_ts,
          subtotal, delivery_fee, discount, total, payment_status, notes)
         VALUES (:user_id::uuid, :property_id::uuid, 'pending', :delivery_type,
                 :address_id::uuid, :scheduled_ts::timestamptz,
                 :subtotal, :delivery_fee, :discount, :total, 'unpaid', :notes)
         RETURNING id`,
        [
          { name: "user_id", value: user_id },
          { name: "property_id", value: property_id ?? null },
          { name: "delivery_type", value: delivery_type },
          { name: "address_id", value: address_id ?? null },
          { name: "scheduled_ts", value: scheduled_ts ?? null },
          { name: "subtotal", value: subtotal },
          { name: "delivery_fee", value: delivery_fee },
          { name: "discount", value: discount },
          { name: "total", value: total },
          { name: "notes", value: notes ?? null },
        ],
        tx
      );
      const order_id = orderRows[0].id;

      // Insert each item with server-trusted price
      for (const row of menuRows) {
        await query(
          `INSERT INTO order_items (order_id, menu_item_id, qty, unit_price, notes)
           VALUES (:order_id::uuid, :menu_item_id::uuid, :qty, :unit_price, :notes)`,
          [
            { name: "order_id", value: order_id },
            { name: "menu_item_id", value: row.id },
            { name: "qty", value: idToQty.get(row.id)! },
            { name: "unit_price", value: Number(row.price) },
            { name: "notes", value: idToNotes.get(row.id) ?? null },
          ],
          tx
        );
      }

      await commit(tx);
      return res.status(201).json({
        order: {
          id: order_id,
          status: "pending",
          delivery_type,
          scheduled_ts: scheduled_ts ?? null,
          subtotal,
          delivery_fee,
          discount,
          total,
          payment_status: "unpaid",
        },
      });
    } catch (e) {
      await rollback(tx);
      throw e;
    }
  } catch (e: any) {
    return res.status(500).json({ error: { message: e.message } });
  }
}

// --- GET /api/v1/orders (mine)
export async function listMyOrders(req: AuthedRequest, res: Response) {
  try {
    const { rows } = await query<any>(
      `
      SELECT
        o.id,
        o.status,
        o.delivery_type,
        o.scheduled_ts,
        o.subtotal,
        o.delivery_fee,
        o.discount,
        o.total,
        o.payment_status,
        o.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'menu_item_id', oi.menu_item_id,
              'qty', oi.qty,
              'unit_price', oi.unit_price,
              'name', mi.name
            )
          ) FILTER (WHERE oi.menu_item_id IS NOT NULL),
          '[]'::json
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id
      WHERE o.user_id = :uid::uuid
      GROUP BY o.id
      ORDER BY o.created_at DESC
      `,
      [{ name: "uid", value: req.user!.id }]
    );
    res.json({ data: rows });
  } catch (e: any) {
    res.status(500).json({ error: { message: e.message } });
  }
}

// --- GET /api/v1/orders/:id (mine)
export async function getMyOrder(req: AuthedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { rows } = await query<any>(
      `
      SELECT
        o.id,
        o.status,
        o.delivery_type,
        o.scheduled_ts,
        o.subtotal,
        o.delivery_fee,
        o.discount,
        o.total,
        o.payment_status,
        o.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'menu_item_id', oi.menu_item_id,
              'qty', oi.qty,
              'unit_price', oi.unit_price,
              'name', mi.name
            )
          ) FILTER (WHERE oi.menu_item_id IS NOT NULL),
          '[]'::json
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id
      WHERE o.user_id = :uid::uuid
        AND o.id = :oid::uuid
      GROUP BY o.id
      LIMIT 1
      `,
      [
        { name: "uid", value: req.user!.id },
        { name: "oid", value: id },
      ]
    );
    const order = rows[0];
    if (!order)
      return res.status(404).json({ error: { message: "Order not found" } });
    res.json({ order });
  } catch (e: any) {
    res.status(500).json({ error: { message: e.message } });
  }
}
