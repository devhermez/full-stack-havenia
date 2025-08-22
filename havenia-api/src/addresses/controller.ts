import { z } from "zod";
import type { Response } from "express";
import type { AuthedRequest } from "../auth/middleware";
import { query, begin, commit, rollback } from "../db";

const AddressBody = z.object({
  line1: z.string().min(1),
  line2: z.string().optional().nullable(),
  city: z.string().min(1),
  province: z.string().min(1),
  postal_code: z.string().min(1),
  country: z.string().min(1),
  is_default: z.boolean().optional(), // if true on create, make it sole default
});

const IdParam = z.object({ id: z.uuid() });

export async function listMyAddresses(req: AuthedRequest, res: Response) {
  try {
    const { rows } = await query(
      `SELECT id, line1, line2, city, province, postal_code, country, is_default, created_at
       FROM delivery_addresses
       WHERE user_id = :uid::uuid
       ORDER BY is_default DESC, created_at DESC`,
      [{ name: "uid", value: req.user!.id }]
    );
    return res.json({ data: rows });
  } catch (e: any) {
    return res.status(500).json({ error: { message: e.message } });
  }
}

export async function createAddress(req: AuthedRequest, res: Response) {
  const parsed = AddressBody.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: z.treeifyError(parsed.error) });
  const { is_default = false, ...addr } = parsed.data;

  const tx = await begin();
  try {
    if (is_default) {
      await query(
        `UPDATE delivery_addresses SET is_default = FALSE WHERE user_id = :uid::uuid`,
        [{ name: "uid", value: req.user!.id }],
        tx
      );
    }

    const { rows } = await query<{ id: string }>(
      `INSERT INTO delivery_addresses
         (id, user_id, line1, line2, city, province, postal_code, country, is_default, created_at)
       VALUES
         (gen_random_uuid(), :uid::uuid, :line1, :line2, :city, :province, :postal_code, :country, :is_default, now())
       RETURNING id`,
      [
        { name: "uid", value: req.user!.id },
        { name: "line1", value: addr.line1 },
        { name: "line2", value: addr.line2 ?? null },
        { name: "city", value: addr.city },
        { name: "province", value: addr.province },
        { name: "postal_code", value: addr.postal_code },
        { name: "country", value: addr.country },
        { name: "is_default", value: is_default },
      ],
      tx
    );

    await commit(tx);
    return res.status(201).json({ id: rows[0].id });
  } catch (e: any) {
    await rollback(tx);
    return res.status(500).json({ error: { message: e.message } });
  }
}

export async function updateAddress(req: AuthedRequest, res: Response) {
  const pid = IdParam.safeParse(req.params);
  if (!pid.success) return res.status(422).json({ error: z.treeifyError(pid.error) });
  const { id } = pid.data;

  const parsed = AddressBody.partial().safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: z.treeifyError(parsed.error) });
  const body = parsed.data;

  const tx = await begin();
  try {
    if (body.is_default === true) {
      await query(
        `UPDATE delivery_addresses SET is_default = FALSE WHERE user_id = :uid::uuid`,
        [{ name: "uid", value: req.user!.id }],
        tx
      );
    }

    // Only update provided fields
    const { rows } = await query(
      `UPDATE delivery_addresses
       SET
         line1 = COALESCE(:line1, line1),
         line2 = COALESCE(:line2, line2),
         city = COALESCE(:city, city),
         province = COALESCE(:province, province),
         postal_code = COALESCE(:postal_code, postal_code),
         country = COALESCE(:country, country),
         is_default = COALESCE(:is_default, is_default)
       WHERE id = :id::uuid AND user_id = :uid::uuid
       RETURNING id`,
      [
        { name: "line1", value: body.line1 ?? null },
        { name: "line2", value: body.line2 ?? null },
        { name: "city", value: body.city ?? null },
        { name: "province", value: body.province ?? null },
        { name: "postal_code", value: body.postal_code ?? null },
        { name: "country", value: body.country ?? null },
        { name: "is_default", value: body.is_default ?? null },
        { name: "id", value: id },
        { name: "uid", value: req.user!.id },
      ],
      tx
    );

    await commit(tx);
    if (!rows.length) return res.status(404).json({ error: { message: "Address not found" } });
    return res.json({ ok: true, id: rows[0].id });
  } catch (e: any) {
    await rollback(tx);
    return res.status(500).json({ error: { message: e.message } });
  }
}

export async function deleteAddress(req: AuthedRequest, res: Response) {
  const pid = IdParam.safeParse(req.params);
  if (!pid.success) return res.status(422).json({ error: z.treeifyError(pid.error) });
  const { id } = pid.data;

  try {
    const { rows } = await query<{ id: string }>(
      `DELETE FROM delivery_addresses WHERE id = :id::uuid AND user_id = :uid::uuid RETURNING id`,
      [
        { name: "id", value: id },
        { name: "uid", value: req.user!.id },
      ]
    );
    if (!rows.length) return res.status(404).json({ error: { message: "Address not found" } });
    return res.json({ ok: true, id: rows[0].id });
  } catch (e: any) {
    return res.status(500).json({ error: { message: e.message } });
  }
}

export async function makeDefaultAddress(req: AuthedRequest, res: Response) {
  const pid = IdParam.safeParse(req.params);
  if (!pid.success) return res.status(422).json({ error: z.treeifyError(pid.error) });
  const { id } = pid.data;

  const tx = await begin();
  try {
    await query(
      `UPDATE delivery_addresses SET is_default = FALSE WHERE user_id = :uid::uuid`,
      [{ name: "uid", value: req.user!.id }],
      tx
    );
    const { rows } = await query<{ id: string }>(
      `UPDATE delivery_addresses SET is_default = TRUE
       WHERE id = :id::uuid AND user_id = :uid::uuid
       RETURNING id`,
      [
        { name: "id", value: id },
        { name: "uid", value: req.user!.id },
      ],
      tx
    );
    await commit(tx);

    if (!rows.length) return res.status(404).json({ error: { message: "Address not found" } });
    return res.json({ ok: true, id: rows[0].id });
  } catch (e: any) {
    await rollback(tx);
    return res.status(500).json({ error: { message: e.message } });
  }
}