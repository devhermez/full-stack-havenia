"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";

/** ===== Types that match your controller ===== */

export type Activity = {
  id: string;
  property_id: string;
  name: string;
  type: string;
  description: string | null;
  duration_mins: number;
  base_price: string; // numeric string from SQL
  min_age: number | null;
  requires_waiver: boolean;
  created_at: string;
  upcoming_sessions?: number;
  image_url?: string;
  next_session?: {
    id: string;
    start_ts: string;
    end_ts: string;
    capacity: number;
    price_override: string | null;
  } | null;
};

export type Session = {
  id: string;
  activity_id: string;
  start_ts: string;
  end_ts: string;
  capacity: number;
  price_override: string | null;
  booked_count: number;
};

export type BookingMine = {
  id: string;
  status: "pending" | "confirmed" | "canceled";
  price: string;      // numeric string
  created_at: string;
  start_ts: string;   // from session
  end_ts: string;
  activity_id: string;
  activity_name: string;
  activity_type: string;
  requires_waiver: boolean;
};

/** ===== Queries ===== */

// GET /activities?property_id?&type?
export const useActivities = (params?: { property_id?: string; type?: string }) =>
  useQuery({
    queryKey: ["activities", params ?? {}],
    queryFn: async () => {
      const { data } = await api.get<{ data: Activity[] }>("/activities", { params });
      return data.data;
    },
  });

// GET /activities/:id
export const useActivity = (id: string) =>
  useQuery({
    queryKey: ["activities", id],
    queryFn: async () => {
      const { data } = await api.get<{ activity: Activity }>(`/activities/${id}`);
      return data.activity;
    },
    enabled: !!id,
  });

// GET /activities/:id/sessions?from?&to?
export const useActivitySessions = (id: string, params?: { from?: string; to?: string }) =>
  useQuery({
    queryKey: ["activities", id, "sessions", params ?? {}],
    queryFn: async () => {
      const { data } = await api.get<{ data: Session[] }>(`/activities/${id}/sessions`, {
        params,
      });
      return data.data;
    },
    enabled: !!id,
  });

// GET /activities/me/bookings
export const useMyActivityBookings = (opts?: { enabled?: boolean }) => {
  const token = getToken(); // client-only
  const enabled = (opts?.enabled ?? true) && !!token;

  return useQuery({
    queryKey: ["me", "bookings"],
    enabled,                                // <-- don’t run on server / before mount
    queryFn: async () => {
      const { data } = await api.get<{ data: BookingMine[] }>(
        "/activities/me/bookings",
        { headers: { "Cache-Control": "no-cache" } }
      );
      return data.data;
    },
    retry: (count, err: any) => {
      const s = err?.response?.status;
      return s && s >= 400 && s < 500 ? false : count < 3;
    },
  });
};

/** ===== Mutations ===== */

// POST /activities/:id/bookings  body: { session_id, participant_age?, acknowledged_waiver? }
export const useCreateBooking = (activityId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      session_id: string;
      participant_age?: number;
      acknowledged_waiver?: boolean;
    }) => {
      const { data } = await api.post<{ booking: { id: string } }>(
        `/activities/${activityId}/bookings`,
        body
      );
      return data.booking.id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me", "bookings"] });
      qc.invalidateQueries({ queryKey: ["activities", activityId, "sessions"] });
    },
  });
};

// PUT /activities/me/bookings/:id/cancel
export const useCancelMyBooking = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId: string) => {
      await api.put(`/activities/me/bookings/${bookingId}/cancel`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me", "bookings"] }),
  });
};