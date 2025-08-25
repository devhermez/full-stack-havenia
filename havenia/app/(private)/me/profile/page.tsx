"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ClientNav from "@/components/ClientNav";
import { api, setAuthToken } from "@/lib/api";
import { getToken, clearToken } from "@/lib/auth";
import type { AxiosError } from "axios";
import Link from "next/link";
type User = {
  id: string;
  name: string;
  email: string;
  role?: "user" | "admin";
  createdAt?: string;
  updatedAt?: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setMounted(true);

    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    setAuthToken(token); // ensure Authorization header is set

    (async () => {
      try {
        const { data } = await api.get<{ user: User }>("/auth/me");
        setUser(data.user);
      } catch (_e: unknown) {
        const axErr = _e as AxiosError<any>;
        const msg =
          axErr.response?.data?.error?.message ??
          axErr.response?.data?.message ??
          axErr.message ??
          "Failed to load profile";
        setErr(msg);

        if ((axErr.response?.status ?? 0) === 401) {
          clearToken();
          router.replace("/login");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (!mounted) return null;

  return (
    <>
      <ClientNav />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-6">Your Profile</h1>

        {loading && (
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-2/5" />
          </div>
        )}

        {!loading && err && <p className="text-red-600">{err}</p>}

        {!loading && user && (
          <div className="bg-white rounded-2xl shadow p-6 space-y-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="text-lg font-medium">{user.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-lg font-medium">{user.email}</p>
            </div>
            {user.role && (
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <span className="inline-block rounded-lg border px-2 py-1 text-sm">
                  {user.role}
                </span>
              </div>
            )}
            {user.createdAt && (
              <div>
                <p className="text-sm text-gray-500">Member since</p>
                <p className="text-lg font-medium">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            )}
            <Link href="/addresses" className="hover:underline">Addresses</Link>
            

            <div className="pt-2">
              <button
                onClick={() => {
                  clearToken();
                  router.replace("/login");
                }}
                className="rounded-lg border px-4 py-2"
              >
                Sign out
              </button>
              <button
                onClick={() => router.push("/me/profile/edit")}
                className="rounded-lg border px-4 py-2"
              >
                Edit
              </button>
            </div>
            
          </div>
        )}
      </main>
    </>
  );
}
