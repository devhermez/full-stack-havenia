"use client";

import { Elements } from "@stripe/react-stripe-js";
import { useParams, useRouter } from "next/navigation";
import { getStripe } from "@/lib/stripe";
import { useCreateOrderPI } from "@/hooks/payments";
import PayWithCard from "@/components/PayWithCard";
import { useEffect } from "react";

export default function OrderPayPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const createIntent = useCreateOrderPI();

  useEffect(() => {
    if (id) createIntent.mutate(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (createIntent.isPending) return <p className="p-6">Preparing payment…</p>;
  if (createIntent.isError)
    return <p className="p-6 text-red-600">Failed to create payment.</p>;

  const clientSecret = createIntent.data?.client_secret;
  if (!clientSecret) return <p className="p-6">No client secret.</p>;

  return (
    <div className="w-screen px-6 py-8 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-4">Pay for Order</h1>

      <Elements stripe={getStripe()} options={{ clientSecret }}>
        <PayWithCard
          clientSecret={clientSecret}
          onSuccess={() => router.push(`/orders/${id}`)}
        />
      </Elements>
    </div>
  );
}