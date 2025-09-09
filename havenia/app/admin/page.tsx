// app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import AdminGuard from "@/components/AdminGuard";
import ClientNav from "@/components/ClientNav";
import AdminNav from "@/components/AdminNav";
import Link from "next/link";
import { api } from "@/lib/api";
import type { AxiosError } from "axios";

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  role?: string | null;
  created_at?: string;
};

type AdminMenuItem = {
  id: string;
  name: string;
  price: number | string;
  category: string | null;
};

type AdminReservation = {
  id: string;
  status: string;
  start_date: string;
  end_date: string;
  created_at?: string;
  room_name?: string | null;
  user_email?: string | null;
};

type AdminBooking = {
  id: string;
  status: string;
  payment_status?: string | null;
  created_at?: string;
  activity_name?: string | null;
  start_ts?: string;
  user_email?: string | null;
};

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [menu, setMenu] = useState<AdminMenuItem[]>([]);
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);

  useEffect(() => {
    (async () => {
      try {
        // Menu (public endpoint already exists)
        const menuRes = await api.get<{ data: AdminMenuItem[] }>("/menu");
        setMenu(menuRes.data.data.slice(0, 3));

        // Admin resources (assumes these admin endpoints exist)
        const [u, r, b] = await Promise.all([
          api.get<{ data: AdminUser[] }>("/admin/users"),
          api.get<{ data: AdminReservation[] }>("/admin/reservations"),
          api.get<{ data: AdminBooking[] }>("/admin/bookings"),
        ]);

        setUsers((u.data.data ?? []).slice(0, 3));
        setReservations((r.data.data ?? []).slice(0, 3));
        setBookings((b.data.data ?? []).slice(0, 3));
      } catch (e) {
        const ax = e as AxiosError<any>;
        setErr(
          ax.response?.data?.error?.message ??
            ax.message ??
            "Failed to load dashboard"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AdminGuard>
      <main className="max-w-5xl mx-auto min-h-auto px-4 py-8 text-black">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Admin · Dashboard</h1>
        </div>

        {loading && <p>Loading…</p>}
        {err && <p className="text-red-600">{err}</p>}

        {!loading && !err && (
          <div className="grid gap-6">
            {/* Admin info quick links */}
            <div className="bg-white rounded-2xl shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">Users</h2>
                <Link href="/admin/users" className="text-sm underline">
                  View all
                </Link>
              </div>
              <div className="space-y-2">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <div className="font-medium">{u.name ?? "(no name)"}</div>
                      <div className="text-gray-600">{u.email}</div>
                    </div>
                    <span className="text-xs rounded border px-2 py-0.5">
                      {u.role ?? "user"}
                    </span>
                  </div>
                ))}
                {users.length === 0 && (
                  <p className="text-gray-600 text-sm">No users yet.</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">Menu (first 3)</h2>
                <Link href="/admin/menu" className="text-sm underline">
                  Manage
                </Link>
              </div>
              <div className="space-y-2">
                {menu.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <div className="font-medium">{m.name}</div>
                      <div className="text-gray-600">
                        {m.category ?? "Uncategorized"}
                      </div>
                    </div>
                    <div className="font-medium">
                      {Intl.NumberFormat(undefined, {
                        style: "currency",
                        currency: "USD",
                      }).format(Number(m.price))}
                    </div>
                  </div>
                ))}
                {menu.length === 0 && (
                  <p className="text-gray-600 text-sm">No menu items yet.</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">Recent Reservations</h2>
                <Link href="/admin/reservations" className="text-sm underline">
                  View all
                </Link>
              </div>
              <div className="space-y-2 text-sm">
                {reservations.map((r) => (
                  <div key={r.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {r.room_name ?? "(room)"}
                      </div>
                      <div className="text-gray-600">
                        {r.start_date} → {r.end_date}
                      </div>
                    </div>
                    <span className="text-xs rounded border px-2 py-0.5">
                      {r.status}
                    </span>
                  </div>
                ))}
                {reservations.length === 0 && (
                  <p className="text-gray-600 text-sm">No reservations yet.</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">Recent Bookings</h2>
                <Link href="/admin/bookings" className="text-sm underline">
                  View all
                </Link>
              </div>
              <div className="space-y-2 text-sm">
                {bookings.map((b) => (
                  <div key={b.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {b.activity_name ?? "(activity)"}
                      </div>
                      <div className="text-gray-600">
                        {b.start_ts
                          ? new Date(b.start_ts).toLocaleString()
                          : ""}
                      </div>
                    </div>
                    <span className="text-xs rounded border px-2 py-0.5">
                      {b.status}
                    </span>
                  </div>
                ))}
                {bookings.length === 0 && (
                  <p className="text-gray-600 text-sm">No bookings yet.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </AdminGuard>
  );
}
