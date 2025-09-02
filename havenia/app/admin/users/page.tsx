// app/admin/users/page.tsx
"use client";

import { useEffect, useState } from "react";
import AdminGuard from "@/components/AdminGuard";
import ClientNav from "@/components/ClientNav";
import { api } from "@/lib/api";
import type { AxiosError } from "axios";

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  role?: string | null;
  created_at?: string;
  profile_image_url?: string | null;
};

export default function AdminUsersPage() {
  const [data, setData] = useState<AdminUser[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<{ data: AdminUser[] }>("/admin/users");
        setData(data.data ?? []);
      } catch (e) {
        const ax = e as AxiosError<any>;
        setErr(ax.response?.data?.error?.message ?? ax.message ?? "Failed to load users");
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
          <h1 className="text-2xl font-semibold">Admin · Users</h1>
        </div>

        {loading && <p>Loading…</p>}
        {err && <p className="text-red-600">{err}</p>}

        {!loading && !err && (
          <div className="bg-white rounded-2xl shadow overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left">User</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {data.map(u => (
                  <tr key={u.id} className="border-t">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={u.profile_image_url || "/avatar-fallback.svg"}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover border"
                        />
                        <div className="font-medium">{u.name ?? "(no name)"}</div>
                      </div>
                    </td>
                    <td className="px-3 py-2">{u.email}</td>
                    <td className="px-3 py-2 text-center">
                      <span className="text-xs rounded border px-2 py-0.5">{u.role ?? "user"}</span>
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {u.created_at ? new Date(u.created_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr><td className="px-3 py-4 text-gray-600" colSpan={4}>No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </AdminGuard>
  );
}