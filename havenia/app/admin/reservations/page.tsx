// app/admin/reservations/page.tsx
"use client";

import { useEffect, useState } from "react";
import AdminGuard from "@/components/AdminGuard";
import ClientNav from "@/components/ClientNav";
import { api } from "@/lib/api";
import type { AxiosError } from "axios";

type AdminReservation = {
  id: string;
  status: "pending" | "confirmed" | "canceled" | string;
  start_date: string;
  end_date: string;
  created_at?: string;
  room_id?: string;
  room_name?: string | null;
  user_email?: string | null;
  user_id?: string;
};

export default function AdminReservationsPage() {
  const [data, setData] = useState<AdminReservation[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<{ data: AdminReservation[] }>("/admin/reservations");
        setData(data.data ?? []);
      } catch (e) {
        const ax = e as AxiosError<any>;
        setErr(ax.response?.data?.error?.message ?? ax.message ?? "Failed to load reservations");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AdminGuard>
      <ClientNav />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Admin · Reservations</h1>
        </div>

        {loading && <p>Loading…</p>}
        {err && <p className="text-red-600">{err}</p>}

        {!loading && !err && (
          <div className="bg-white rounded-2xl shadow overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left">Room</th>
                  <th className="px-3 py-2">Stay</th>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {data.map(r => (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2">
                      <div className="font-medium">{r.room_name ?? r.room_id ?? "(room)"}</div>
                      <div className="text-gray-600">{r.id}</div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {r.start_date} → {r.end_date}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {r.user_email ?? r.user_id ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="text-xs rounded border px-2 py-0.5">{r.status}</span>
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {r.created_at ? new Date(r.created_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr><td className="px-3 py-4 text-gray-600" colSpan={5}>No reservations found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </AdminGuard>
  );
}
