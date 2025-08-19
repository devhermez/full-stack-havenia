import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { query } from './db';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/healthz', (_req, res) => res.status(200).send('ok'));

app.get('/readiness', async (_req, res) => {
  try {
    await query('SELECT 1 AS ok');
    res.status(200).send('ready');
  } catch (e: any) {
    res.status(500).send(e?.message ?? 'not ready');
  }
});

app.get('/api/v1/menu', async (req, res) => {
  try {
    const { property_id, category } = req.query as { property_id?: string; category?: string };

    const sql = `
      SELECT mi.id, mi.name, mi.description, mi.price, mi.in_stock, mi.image_url,
             mc.name AS category, mi.property_id
      FROM menu_items mi
      LEFT JOIN menu_categories mc ON mc.id = mi.category_id
      WHERE (:p1::uuid IS NULL OR mi.property_id = :p1::uuid)
        AND (:p2::text IS NULL OR mc.name = :p2::text)
      ORDER BY mc.name NULLS LAST, mi.name
    `;

    const p1 = property_id && property_id.trim() !== '' ? property_id : null;
    const p2 = category && category.trim() !== '' ? category : null;

    const { rows } = await query(sql, [
      { name: 'p1', value: p1 },
      { name: 'p2', value: p2 },
    ]);

    res.json({ data: rows });
  } catch (e: any) {
    res.status(500).json({ error: { message: e.message } });
  }
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`Havenia API listening on :${port}`));