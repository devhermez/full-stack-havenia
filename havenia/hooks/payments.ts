// hooks/payments.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

type IntentResponse = { client_secret: string; payment_intent_id: string };

export const useCreateOrderPI = () =>
  useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await api.post<IntentResponse>(
        `/payments/orders/${orderId}/intent`,
        {},
        {
          // avoid accidental double charges if user double-clicks
          headers: { "Idempotency-Key": crypto.randomUUID() },
        }
      );
      return data;
    },
  });

export const useCreateReservationPI = () =>
  useMutation({
    mutationFn: async (reservationId: string) => {
      const { data } = await api.post<IntentResponse>(
        `/payments/reservations/${reservationId}/intent`,
        {},
        {
          headers: { "Idempotency-Key": crypto.randomUUID() },
        }
      );
      return data;
    },
  });

  export const useCreateActivityBookingPI = () =>
  useMutation({
    mutationFn: async (bookingId: string) => {
      const { data } = await api.post<{ client_secret: string; payment_intent_id: string }>(
        `/payments/bookings/${bookingId}/intent`,
        {},
        { headers: { "Idempotency-Key": crypto.randomUUID() } }
      );
      return data;
    },
  });