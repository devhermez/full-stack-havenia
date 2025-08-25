"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, setAuthToken } from "@/lib/api";
import { saveToken } from "@/lib/auth";
import type { AxiosError } from "axios";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    try {
      const { data } = await api.post<{ token: string }>("/auth/register", {
        name,
        email,
        password,
      });

      saveToken(data.token);
      setAuthToken(data.token);
      router.push("/profile"); // go to a PAGE, not API
    } catch (_e: unknown) {
      const axErr = _e as AxiosError<any>;
      const msg =
        axErr.response?.data?.error?.message ??
        axErr.response?.data?.message ??
        axErr.message ??
        "Registration failed";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex items-center justify-center min-h-screen px-4">
      <div className="bg-white rounded-2xl shadow p-6 space-y-4 max-w-sm w-full">
        <h1 className="text-xl font-semibold">Create Account</h1>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full Name"
            autoComplete="name"
          />
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            autoComplete="email"
          />
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            autoComplete="new-password"
          />

          {err && <p className="text-red-600 text-sm">{err}</p>}

          <button
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-50 w-full"
          >
            {loading ? "Signing up…" : "Sign up"}
          </button>
        </form>

        <p className="text-sm text-gray-600">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </main>
  );
}
