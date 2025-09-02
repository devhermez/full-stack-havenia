// app/admin/bookings/page.tsx
"use client";

import { useEffect, useState } from "react";
import AdminGuard from "@/components/AdminGuard";
import ClientNav from "@/components/ClientNav";
import { api } from "@/lib/api";
import type { AxiosError } from "axios";

type AdminBooking = {
  id: string;
  status: "pending" | "confirmed" | "canceled" | string;
  payment_status?: "unpaid" | "paid" | "failed" | string | null;
  guests?: number | null;
  created_at?: string;
  activity_id?: string;
  activity_name?: string | null;
  start_ts?: string;
  end_ts?: string;
  user_email?: string | null;
  user_id?: string;
};

export default function AdminBookingsPage() {
  const [data, setData] = useState<AdminBooking[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<{ data: AdminBooking[] }>("/admin/bookings");
        setData(data.data ?? []);
      } catch (e) {
        const ax = e as AxiosError<any>;
        setErr(ax.response?.data?.error?.message ?? ax.message ?? "Failed to load bookings");
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
          <h1 className="text-2xl font-semibold">Admin · Bookings</h1>
        </div>

        {loading && <p>Loading…</p>}
        {err && <p className="text-red-600">{err}</p>}

        {!loading && !err && (
          <div className="bg-white rounded-2xl shadow overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left">Activity</th>
                  <th className="px-3 py-2">Session</th>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Guests</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Payment</th>
                  <th className="px-3 py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {data.map(b => (
                  <tr key={b.id} className="border-t">
                    <td className="px-3 py-2">
                      <div className="font-medium">{b.activity_name ?? b.activity_id ?? "(activity)"}</div>
                      <div className="text-gray-600">{b.id}</div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {b.start_ts ? new Date(b.start_ts).toLocaleString() : "—"}
                    </td>
                    <td className="px-3 py-2 text-center">{b.user_email ?? b.user_id ?? "—"}</td>
                    <td className="px-3 py-2 text-center">{b.guests ?? 1}</td>
                    <td className="px-3 py-2 text-center">
                      <span className="text-xs rounded border px-2 py-0.5">{b.status}</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="text-xs rounded border px-2 py-0.5">{b.payment_status ?? "—"}</span>
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {b.created_at ? new Date(b.created_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr><td className="px-3 py-4 text-gray-600" colSpan={7}>No bookings found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </AdminGuard>
  );
}