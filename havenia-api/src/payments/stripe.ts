import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!;
export const stripe = new Stripe(STRIPE_SECRET_KEY);
export const CURRENCY = (process.env.CURRENCY || "usd").toLowerCase();