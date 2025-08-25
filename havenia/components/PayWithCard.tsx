// components/PayWithCard.tsx
"use client";

import { useState } from "react";
import {
  CardElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

type Props = {
  clientSecret: string;
  onSuccess?: (paymentIntentId: string) => void;
};

export default function PayWithCard({ clientSecret, onSuccess }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handlePay() {
    if (!stripe || !elements) return;
    setSubmitting(true);
    setErr(null);

    const card = elements.getElement(CardElement);
    if (!card) {
      setErr("Payment element not ready.");
      setSubmitting(false);
      return;
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      { payment_method: { card } }
    );

    if (error) {
      setErr(error.message ?? "Payment failed");
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess?.(paymentIntent.id);
    } else {
      setErr("Payment could not be completed.");
    }
    setSubmitting(false);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-3 bg-white">
        <CardElement options={{ hidePostalCode: true }} />
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}

      <button
        onClick={handlePay}
        disabled={!stripe || submitting}
        className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
      >
        {submitting ? "Processing…" : "Pay now"}
      </button>
    </div>
  );
}