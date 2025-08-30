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
    <div className="profile-container w-screen min-h-screen bg-gray-400 text-white">
      <ClientNav />
      <main className="max-w-2xl mx-auto px-4 py-8 w-full">
        <h1 className="text-3xl font-semibold mb-2">Your Profile</h1>
        <p className="mb-4 text-md text-gray-200">This is your space — update your details, change your password, and keep everything ready for your next adventure.</p>

        {loading && (
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-2/5" />
          </div>
        )}

        {!loading && err && <p className="text-red-600">{err}</p>}

        {!loading && user && (
          <div className="bg-white text-black rounded-2xl shadow p-6 space-y-4 w-full flex flex-col gap-2">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="text-md font-medium">{user.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="text-md font-medium">{user.email}</p>
            </div>
            {user.role && (
              <div>
                <p className="text-sm text-gray-600">Role</p>
                <span className="inline-block text-md">
                  {user.role}
                </span>
              </div>
            )}
            {user.createdAt && (
              <div>
                <p className="text-sm text-gray-600">Member since</p>
                <p className="text-md font-medium">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            )}
            <div className="addresses-section flex flex-col gap-1">
              <p className="text-sm text-gray-600">Addresses</p>
              <p className="text-sm text-gray-400">Your safety is our concern, please head to addresses to view/change your registered location.</p>
              <Link href="/me/addresses" className="hover:underline rounded-lg border p-2  text-sm text-center">Change Addresses</Link>
            </div>
            <div className="addresses-section flex flex-col gap-1">
              <p className="text-sm text-gray-600">Orders</p>
              <p className="text-sm text-gray-400">Check your current orders here!</p>
              <Link href="/me/orders" className="hover:underline rounded-lg border p-2  text-sm text-center">View Orders</Link>
            </div>
            <div className="addresses-section flex flex-col gap-1">
              <p className="text-sm text-gray-600">Reservations</p>
              <p className="text-sm text-gray-400">Check your existing reservations here!</p>
              <Link href="/me/reservations" className="hover:underline rounded-lg border p-2  text-sm text-center">View Reservations</Link>
            </div>
            <div className="addresses-section flex flex-col gap-1">
              <p className="text-sm text-gray-600">Activities</p>
              <p className="text-sm text-gray-400">Check your booked sessions here!</p>
              <Link href="/me/bookings" className="hover:underline rounded-lg border p-2  text-sm text-center">View Activities</Link>
            </div>
            

            <div className=" w-full flex justify-between">
              <button
                onClick={() => router.push("/me/profile/edit")}
                className="rounded-lg border px-4 py-2"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  clearToken();
                  router.replace("/login");
                }}
                className="rounded-lg border px-4 py-2"
              >
                Sign out
              </button>
              
            </div>
            
          </div>
        )}
      </main>
    </div>
  );
}
