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

// Convert a numeric amount in USD to cents (minor units) safely.
function asUSD(amountLike: string | number): number {
  const n = typeof amountLike === "string" ? Number(amountLike) : amountLike;
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100); // cents
}

const MIN_USD_CENTS = 50; // Stripe minimum charge = $0.50
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

  const rawTotal = Number(o.total);
  if (!Number.isFinite(rawTotal)) {
    return res.status(400).json({ error: { message: "Invalid order total" } });
  }
  const amountInCents = asUSD(rawTotal);
  if (amountInCents < MIN_USD_CENTS) {
    return res.status(422).json({ error: { message: "Minimum payment is $0.50" } });
  }

  const idempotencyKey = req.headers["idempotency-key"] as string | undefined;

  const pi = await stripe.paymentIntents.create(
    {
      amount: amountInCents,
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

  const price = Number(r.price);
  if (!Number.isFinite(price)) {
    return res.status(400).json({ error: { message: "Invalid reservation amount" } });
  }

  const amountInCents = asUSD(price * nights);
  if (amountInCents < MIN_USD_CENTS) {
    return res.status(422).json({ error: { message: "Minimum payment is $0.50" } });
  }

  const idempotencyKey = req.headers["idempotency-key"] as string | undefined;

  const pi = await stripe.paymentIntents.create(
    {
      amount: amountInCents,
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

/* ---------- Create PI for ACTIVITY BOOKING ---------- */
async function createActivityBookingPI(req: AuthedRequest, res: Response) {
  const parsed = IdParam.safeParse(req.params);
  if (!parsed.success) {
    return res.status(422).json({ error: z.treeifyError(parsed.error) });
  }
  const { id } = parsed.data;

  // Pull total & ownership; guests has a DB default of 1 in this setup
  const { rows } = await query<{
    id: string;
    user_id: string;
    total: string; // numerics come back as strings
    guests: number | null;
    status: string;
  }>(
    `SELECT id, user_id, total, guests, status
     FROM activity_bookings
     WHERE id = :id::uuid`,
    [{ name: "id", value: id }]
  );

  const b = rows[0];
  if (!b || b.user_id !== req.user!.id) {
    return res.status(404).json({ error: { message: "Booking not found" } });
  }
  if (b.status === "canceled") {
    return res.status(400).json({ error: { message: "Booking is canceled" } });
  }

  // total is per booking in this schema; multiply by guests if your model requires it.
  const total = Number(b.total);
  if (!Number.isFinite(total)) {
    return res.status(400).json({ error: { message: "Invalid booking total" } });
  }
  const amountInCents = asUSD(total);
  if (amountInCents < MIN_USD_CENTS) {
    return res.status(422).json({ error: { message: "Minimum payment is $0.50" } });
  }

  const idempotencyKey = req.headers["idempotency-key"] as string | undefined;

  const pi = await stripe.paymentIntents.create(
    {
      amount: amountInCents,
      currency: CURRENCY,
      metadata: {
        kind: "activity_booking",
        booking_id: id,
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
  console.warn(
    "Warning: STRIPE_WEBHOOK_SECRET is not set; webhook verification will fail"
  );
}

// raw body parser for Stripe webhook — DO NOT mount with express.json()
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

      if (kind === "activity_booking" && pi.metadata?.booking_id) {
        await query(
          `UPDATE activity_bookings
             SET status='confirmed', payment_status='paid'
           WHERE id = :id::uuid`,
          [{ name: "id", value: pi.metadata.booking_id }]
        );
      }

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

    // Failure — mark failed/canceled (best-effort)
    if (event.type === "payment_intent.payment_failed") {
      const pi = event.data.object as Stripe.PaymentIntent;
      const kind = pi.metadata?.kind;

      if (kind === "activity_booking" && pi.metadata?.booking_id) {
        await query(
          `UPDATE activity_bookings
             SET status='canceled', payment_status='failed'
           WHERE id = :id::uuid
             AND status IN ('pending','confirmed')`,
          [{ name: "id", value: pi.metadata.booking_id }]
        );
      }

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
router.post("/bookings/:id/intent", requireAuth, createActivityBookingPI);

// Do NOT mount /webhook here; mount at app level before express.json().
export { stripeWebhook, handleWebhook };
export default router;