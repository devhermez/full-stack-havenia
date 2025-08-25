"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ClientNav from "@/components/ClientNav";
import { api, setAuthToken } from "@/lib/api";
import { getToken, clearToken } from "@/lib/auth";
import type { AxiosError } from "axios";

type Me = { user: { id: string; name: string | null; email: string } };

export default function EditProfilePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(""); // read-only display
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prefill current user
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setAuthToken(token);

    (async () => {
      try {
        const { data } = await api.get<Me>("/auth/me");
        setName(data.user.name ?? "");
        setEmail(data.user.email);
        setMounted(true);
      } catch (_e) {
        const ax = _e as AxiosError<any>;
        if ([401, 422].includes(ax.response?.status ?? 0)) {
          clearToken();
          router.replace("/login");
          return;
        }
        setErr(
          ax.response?.data?.error?.message ??
            ax.response?.data?.message ??
            ax.message ??
            "Failed to load profile"
        );
      }
    })();
  }, [router]);

  const nothingToUpdate =
    name.trim() === "" && currentPassword === "" && newPassword === "";

  const passwordPairInvalid = !!currentPassword !== !!newPassword;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (passwordPairInvalid) {
      setErr("Both current and new password are required together.");
      return;
    }
    if (nothingToUpdate) {
      setErr("Nothing to update.");
      return;
    }

    setLoading(true);
    setErr(null);
    setOk(false);

    try {
      const token = getToken();
      if (!token) {
        router.replace("/login");
        return;
      }
      setAuthToken(token);

      const payload = {
        name: name || undefined,
        current_password: currentPassword || undefined,
        new_password: newPassword || undefined,
      };

      await api.put("/auth/me", payload);
      setOk(true);
      router.push("/profile");
    } catch (_e) {
      const ax = _e as AxiosError<any>;
      setErr(
        ax.response?.data?.error?.message ??
          ax.response?.data?.message ??
          ax.message ??
          "Update failed"
      );
      if ([401, 422].includes(ax.response?.status ?? 0)) {
        clearToken();
        router.replace("/login");
      }
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <>
      <ClientNav />
      <main className="max-w-md mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-6">Edit Profile</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600">Email</label>
            <input
              className="w-full border rounded-lg px-3 py-2 bg-gray-50"
              value={email}
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Name</label>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm text-gray-600">
                Current Password
              </label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">
                New Password
              </label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                type="password"
                placeholder="At least 8 characters"
              />
            </div>
          </div>

          {passwordPairInvalid && (
            <p className="text-sm text-orange-600">
              Enter both current and new password to change it.
            </p>
          )}
          {err && <p className="text-red-600 text-sm">{err}</p>}
          {ok && <p className="text-green-600 text-sm">Profile updated!</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || passwordPairInvalid}
              className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/profile")}
              className="px-4 py-2 rounded-lg border"
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
