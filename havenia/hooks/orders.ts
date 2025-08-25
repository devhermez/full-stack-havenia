"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

/** ---- Types that mirror your controller payloads ---- */

export type OrderItem = {
  menu_item_id: string;
  qty: number;
  unit_price: number | string; // SQL numerics often arrive as strings
  name: string;
};

export type Order = {
  id: string;
  status: "pending" | "confirmed" | "canceled" | string;
  delivery_type: "pickup" | "delivery";
  scheduled_ts: string | null;
  subtotal: number | string;
  delivery_fee: number | string;
  discount: number | string;
  total: number | string;
  payment_status: "unpaid" | "paid" | string;
  created_at: string;
  items: OrderItem[];
};

export type CreateOrderBody = {
  property_id?: string;
  delivery_type: "pickup" | "delivery";
  address_id?: string;            // required when delivery
  scheduled_ts?: string;          // ISO
  notes?: string;
  items: Array<{
    menu_item_id: string;
    qty: number;
    notes?: string;
  }>;
};

/** ---- Queries ---- */

// GET /api/v1/orders
export const useMyOrders = () =>
  useQuery({
    queryKey: ["orders", "me"],
    queryFn: async () => {
      const { data } = await api.get<{ data: Order[] }>("/orders");
      return data.data;
    },
  });

// GET /api/v1/orders/:id
export const useMyOrder = (id: string) =>
  useQuery({
    queryKey: ["orders", "me", id],
    queryFn: async () => {
      const { data } = await api.get<{ order: Order }>(`/orders/${id}`);
      return data.order;
    },
    enabled: !!id,
  });

/** ---- Mutations ---- */

// POST /api/v1/orders
export const useCreateOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateOrderBody) => {
      const { data } = await api.post<{ order: { id: string } }>("/orders", body);
      return data.order.id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders", "me"] });
    },
  });
};