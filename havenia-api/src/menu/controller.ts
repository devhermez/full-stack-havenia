import { z } from "zod";
import { query } from "../db";
import type { Request, Response } from "express";

const MenuQuery = z.object({
  property_id: z.uuid().optional(),
  category: z.string().min(1).optional(),
});

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
      { name: "p1", value: property_id ?? null },
      { name: "p2", value: category ?? null },
    ]);

    return res.json({ data: rows });
  } catch (e: any) {
    return res.status(500).json({ error: { message: e.message } });
  }
}