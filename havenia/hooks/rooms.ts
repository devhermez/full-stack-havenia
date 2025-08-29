"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ----- Types (aligned to your controller outputs) -----
export type Room = {
  id: string;
  property_id: string;
  name: string;
  capacity: number;
  price: string; // numeric-from-DB as string
  created_at: string;
  // when listing with dates:
  nights?: number;
  est_total?: string; // computed string
};

export type Reservation = {
  id: string;
  status: "pending" | "confirmed" | "canceled";
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  created_at?: string;
  nights: number;
  est_total: string; // formatted/returned string
  room_id: string;
  room_name?: string;
  capacity?: number;
  price?: string;
  property_id?: string;
};

// ----- Queries -----
export const useRooms = (params: {
  property_id: string;
  from?: string;
  to?: string;
  min_capacity?: number;
}) =>
  useQuery({
    queryKey: ["rooms", params],
    queryFn: async () => {
      const { data } = await api.get<{
        data: Room[];
        from?: string;
        to?: string;
        nights?: number;
      }>("/rooms", { params });
      return data.data;
    },
    enabled: !!params.property_id, // require property_id
  });

export const useRoom = (id?: string) =>
  useQuery({
    queryKey: ["room", id],
    queryFn: async () => {
      const { data } = await api.get<{ room: Room }>(`/rooms/${id}`);
      return data.room;
    },
    enabled: !!id,
  });

export const useMyReservations = () =>
  useQuery({
    queryKey: ["reservations"],
    queryFn: async () => {
      const { data } = await api.get<{ data: Reservation[] }>(
        `/rooms/reservations`
      );
      return data.data;
    },
  });

export const useMyReservation = (id?: string) =>
  useQuery({
    queryKey: ["reservation", id],
    queryFn: async () => {
      const { data } = await api.get<{ reservation: Reservation }>(
        `/rooms/reservations/${id}`
      );
      return data.reservation;
    },
    enabled: !!id,
  });

// ----- Mutations -----
export const useCreateReservation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      room_id: string;
      start_date: string;
      end_date: string;
    }) => {
      const { data } = await api.post<{ reservation: Reservation }>(
        `/rooms/reservations`,
        body
      );
      return data.reservation;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservations"] });
    },
  });
};

export const useCancelReservation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/rooms/reservations/${id}/cancel`);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservations"] });
    },
  });
};
