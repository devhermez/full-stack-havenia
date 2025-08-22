// src/payments/routes.ts
import { Router } from "express";
import express from "express";
import Stripe from "stripe";
import { z } from "zod";

import type { AuthedRequest } from "../auth/middleware";
import { requireAuth } from "../auth/middleware";
import { query } from "../db";
import { stripe, CURRENCY } from "./stripe";

type Response = import("express").Response;

/* ---------- helpers ---------- */
function cents(amount: number) {
  return Math.round(amount * 100);
}

const IdParam = z.object({ id: z.uuid() });

/* ---------- Create PI for ORDER ---------- */
async function createOrderPI(req: AuthedRequest, res: Response) {
  const parsed = IdParam.safeParse(req.params);
  if (!parsed.success) {
    return res.status(422).json({ error: z.treeifyError(parsed.error) });
  }
  const { id } = parsed.data;

  // Fetch totals & ownership
  const { rows } = await query<{
    id: string;
    user_id: string;
    subtotal: string;
    delivery_fee: string;
    discount: string;
    total: string;
  }>(
    `SELECT id, user_id, subtotal, delivery_fee, discount, total
     FROM orders
     WHERE id = :id::uuid`,
    [{ name: "id", value: id }]
  );
  const o = rows[0];
  if (!o || o.user_id !== req.user!.id) {
    return res.status(404).json({ error: { message: "Order not found" } });
  }

  const amount = Number(o.total);
  const idempotencyKey = req.headers["idempotency-key"] as string | undefined;

  const pi = await stripe.paymentIntents.create(
    {
      amount: cents(amount),
      currency: CURRENCY,
      metadata: { kind: "order", order_id: id, user_id: req.user!.id },
      automatic_payment_methods: { enabled: true },
    },
    idempotencyKey ? { idempotencyKey } : undefined
  );

  return res.json({
    client_secret: pi.client_secret,
    payment_intent_id: pi.id,
  });
}

/* ---------- Create PI for RESERVATION ---------- */
async function createReservationPI(req: AuthedRequest, res: Response) {
  const parsed = IdParam.safeParse(req.params);
  if (!parsed.success) {
    return res.status(422).json({ error: z.treeifyError(parsed.error) });
  }
  const { id } = parsed.data;

  const { rows } = await query<{
    id: string;
    user_id: string;
    start_date: string;
    end_date: string;
    price: string;
  }>(
    `SELECT r.id, r.user_id, r.start_date, r.end_date, rm.price
     FROM reservations r
     JOIN rooms rm ON rm.id = r.room_id
     WHERE r.id = :id::uuid`,
    [{ name: "id", value: id }]
  );
  const r = rows[0];
  if (!r || r.user_id !== req.user!.id) {
    return res.status(404).json({ error: { message: "Reservation not found" } });
  }

  const nights = Math.floor(
    (Date.parse(r.end_date) - Date.parse(r.start_date)) / (1000 * 60 * 60 * 24)
  );
  if (nights <= 0) {
    return res.status(400).json({ error: { message: "Invalid reservation dates" } });
  }

  const amount = Number(r.price) * nights;
  const idempotencyKey = req.headers["idempotency-key"] as string | undefined;

  const pi = await stripe.paymentIntents.create(
    {
      amount: cents(amount),
      currency: CURRENCY,
      metadata: {
        kind: "reservation",
        reservation_id: id,
        user_id: req.user!.id,
      },
      automatic_payment_methods: { enabled: true },
    },
    idempotencyKey ? { idempotencyKey } : undefined
  );

  return res.json({
    client_secret: pi.client_secret,
    payment_intent_id: pi.id,
  });
}

/* ---------- Webhook (raw body) ---------- */

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!webhookSecret) {
  console.warn("Warning: STRIPE_WEBHOOK_SECRET is not set; webhook verification will fail");
}

// raw body parser for Stripe webhook — DO NOT export it inline to avoid redeclare issues
const stripeWebhook = express.raw({ type: "application/json" });

async function handleWebhook(req: any, res: Response) {
  let event: Stripe.Event;
  try {
    const sig = req.headers["stripe-signature"] as string;
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret!);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Success — mark paid/confirmed
    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as Stripe.PaymentIntent;
      const kind = pi.metadata?.kind;

      if (kind === "order" && pi.metadata?.order_id) {
        await query(
          `UPDATE orders
             SET payment_status='paid', status='confirmed'
           WHERE id = :id::uuid`,
          [{ name: "id", value: pi.metadata.order_id }]
        );
      } else if (kind === "reservation" && pi.metadata?.reservation_id) {
        await query(
          `UPDATE reservations
             SET status='confirmed'
           WHERE id = :id::uuid`,
          [{ name: "id", value: pi.metadata.reservation_id }]
        );
      }
    }

    // Failure — mark failed/canceled
    if (event.type === "payment_intent.payment_failed") {
      const pi = event.data.object as Stripe.PaymentIntent;
      const kind = pi.metadata?.kind;

      if (kind === "order" && pi.metadata?.order_id) {
        await query(
          `UPDATE orders
             SET payment_status='failed', status='canceled'
           WHERE id = :id::uuid
             AND status IN ('pending','confirmed')`,
          [{ name: "id", value: pi.metadata.order_id }]
        );
      } else if (kind === "reservation" && pi.metadata?.reservation_id) {
        await query(
          `UPDATE reservations
             SET status='canceled'
           WHERE id = :id::uuid
             AND status IN ('pending','confirmed')`,
          [{ name: "id", value: pi.metadata.reservation_id }]
        );
      }
    }

    return res.json({ received: true });
  } catch (e: any) {
    return res.status(500).json({ error: { message: e.message } });
  }
}

/* ---------- Router ---------- */

const router = Router();
/**
 * @openapi
 * /api/v1/payments/orders/{id}/intent:
 *   post:
 *     summary: Create Stripe PaymentIntent for an order
 *     tags: [Payments]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Client secret returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 client_secret: { type: string }
 *                 payment_intent_id: { type: string }
 *       401: { description: Unauthorized }
 *       404: { description: Order not found }
 */
router.post("/orders/:id/intent", requireAuth, createOrderPI);
router.post("/reservations/:id/intent", requireAuth, createReservationPI);

// Do NOT mount /webhook here; mount at app level before express.json().
export { stripeWebhook, handleWebhook };
export default router;