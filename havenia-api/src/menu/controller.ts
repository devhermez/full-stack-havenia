import { z } from "zod";
import { query } from "../db";
import type { Request, Response } from "express";

// Query filters from req.query (strings in Express)
const MenuQuery = z.object({
  property_id: z.string().uuid().optional(), // querystring is string, then cast in SQL
  category: z.string().min(1).optional(),
});

// Body schema for create/update
const UpsertMenuItem = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number().nonnegative(),               // send numbers from FE
  category_id: z.string().uuid().optional(),     // if you use category_id
  category: z.string().min(1).optional(),        // or allow plain category name
  in_stock: z.boolean().optional(),
  image_url: z.string().url().optional(),
  prep_minutes: z.number().int().nonnegative().optional(),
  property_id: z.string().uuid().optional(),
});

// Helper to satisfy strict named-param typings
const P = (name: string, value: any) => ({ name, value } as any);

export async function listMenu(req: Request, res: Response) {
  try {
    const parsed = MenuQuery.safeParse(req.query);
    if (!parsed.success) {
      return res.status(422).json({ error: z.treeifyError(parsed.error) });
    }

    const { property_id, category } = parsed.data;

    const sql = `
      SELECT
        mi.id,
        mi.name,
        mi.description,
        mi.price,
        mi.in_stock,
        mi.image_url,
        mi.prep_minutes,
        mi.created_at,
        mc.name AS category,
        mi.property_id
      FROM menu_items mi
      LEFT JOIN menu_categories mc ON mc.id = mi.category_id
      WHERE (:p1::uuid IS NULL OR mi.property_id = :p1::uuid)
        AND (:p2::text IS NULL OR mc.name = :p2::text)
      ORDER BY mc.name NULLS LAST, mi.name
    `;

    const { rows } = await query(sql, [
      P("p1", property_id ?? null),
      P("p2", category ?? null),
    ]);

    return res.json({ data: rows });
  } catch (e: any) {
    return res.status(500).json({ error: { message: e.message } });
  }
}

export async function getMenuItem(req: Request, res: Response) {
  const { id } = req.params;
  const { rows } = await query(
    `
    SELECT
      mi.id,
      mi.name,
      mi.description,
      mi.price,
      mi.in_stock,
      mi.image_url,
      mi.prep_minutes,
      mi.created_at,
      mc.name AS category,
      mi.property_id
    FROM menu_items mi
    LEFT JOIN menu_categories mc ON mc.id = mi.category_id
    WHERE mi.id = :id::uuid
    LIMIT 1
  `,
    [P("id", id)]
  );

  if (!rows.length) {
    return res.status(404).json({ error: { message: "Item not found" } });
  }
  return res.json(rows[0]);
}

export async function createMenuItem(req: Request, res: Response) {
  const parsed = UpsertMenuItem.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ error: z.treeifyError(parsed.error) });
  }

  const {
    name,
    description,
    price,
    category_id,
    category,
    in_stock,
    image_url,
    prep_minutes,
    property_id,
  } = parsed.data;

  // If you accept category name, resolve/create it here; for now assume category_id
  const { rows } = await query(
    `
    INSERT INTO menu_items
      (name, description, price, category_id, in_stock, image_url, prep_minutes, property_id)
    VALUES
      (:name, :description, :price, :category_id, :in_stock, :image_url, :prep_minutes, :property_id)
    RETURNING id, name, description, price, in_stock, image_url, prep_minutes, property_id, created_at
  `,
    [
      P("name", name),
      P("description", description),
      P("price", price),
      P("category_id", category_id ?? null),
      P("in_stock", typeof in_stock === "boolean" ? in_stock : true),
      P("image_url", image_url ?? null),
      P("prep_minutes", prep_minutes ?? null),
      P("property_id", property_id ?? null),
    ]
  );

  return res.status(201).json(rows[0]);
}

export async function updateMenuItem(req: Request, res: Response) {
  const { id } = req.params;

  const parsed = UpsertMenuItem.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ error: z.treeifyError(parsed.error) });
  }

  // Build dynamic SET list (only update provided fields)
  const fields: string[] = [];
  const params: any[] = [P("id", id)];

  const add = (col: string, param: string, val: any) => {
    fields.push(`${col} = :${param}`);
    params.push(P(param, val));
  };

  const b = parsed.data;
  if (b.name !== undefined) add("name", "name", b.name);
  if (b.description !== undefined) add("description", "description", b.description);
  if (b.price !== undefined) add("price", "price", b.price);
  if (b.category_id !== undefined) add("category_id", "category_id", b.category_id ?? null);
  if (b.in_stock !== undefined) add("in_stock", "in_stock", b.in_stock);
  if (b.image_url !== undefined) add("image_url", "image_url", b.image_url ?? null);
  if (b.prep_minutes !== undefined) add("prep_minutes", "prep_minutes", b.prep_minutes);
  if (b.property_id !== undefined) add("property_id", "property_id", b.property_id ?? null);

  if (!fields.length) {
    return res.status(400).json({ error: { message: "Nothing to update" } });
  }

  const sql = `
    UPDATE menu_items
    SET ${fields.join(", ")}
    WHERE id = :id::uuid
    RETURNING id, name, description, price, in_stock, image_url, prep_minutes, property_id, created_at
  `;

  const { rows } = await query(sql, params);
  if (!rows.length) {
    return res.status(404).json({ error: { message: "Item not found" } });
  }
  return res.json(rows[0]);
}

export async function deleteMenuItem(req: Request, res: Response) {
  const { id } = req.params;

  // Your query() returns { rows, numberOfRecordsUpdated }, not rowCount
  const result = await query(
    `DELETE FROM menu_items WHERE id = :id::uuid`,
    [P("id", id)]
  );

  const affected = (result as any).numberOfRecordsUpdated ?? 0;
  if (affected === 0) {
    return res.status(404).json({ error: { message: "Item not found" } });
  }
  return res.json({ ok: true });
}

