"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type Address = {
  id: string;
  line1: string;
  line2: string | null;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
};

// LIST
export const useAddresses = () =>
  useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      const { data } = await api.get<{ data: Address[] }>("/addresses");
      return data.data;
    },
  });

// CREATE
export const useCreateAddress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Omit<Address, "id" | "created_at" | "is_default"> & { is_default?: boolean }) => {
      const { data } = await api.post<{ address: { id: string } }>("/addresses", body);
      return data.address.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
};

// UPDATE
export const useUpdateAddress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<Address> & { id: string }) => {
      await api.put(`/addresses/${id}`, body);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
};

// MAKE DEFAULT
export const useMakeDefaultAddress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/addresses/${id}/default`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
};

// DELETE
export const useDeleteAddress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/addresses/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
};