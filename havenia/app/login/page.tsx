"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, setAuthToken } from "@/lib/api";
import { saveToken } from "@/lib/auth";
import type { AxiosError } from "axios";

export default function LoginPage() {
  const [email, setEmail] = useState("demo@havenia.dev");
  const [password, setPassword] = useState("Password123!");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    try {
      const { data } = await api.post<{ token: string }>("/auth/login", {
        email,
        password,
      });
      saveToken(data.token);
      setAuthToken(data.token);
      router.push("/me/profile"); // go to a PAGE, not an API route
    } catch (_e: unknown) {
      const axErr = _e as AxiosError<any>;
      const msg =
        axErr.response?.data?.error?.message ??
        axErr.response?.data?.message ??
        axErr.message ??
        "Login failed";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-screen min-h-screen bg-white rounded-2xl shadow p-6 space-y-4 max-w-sm mx-auto flex flex-col justify-center">
      
      <form onSubmit={onSubmit} className="space-y-3 border p-4 rounded-2xl">
        <h1 className="text-xl font-semibold">Login</h1>
        <p className="text-sm text-gray-400">Enter your credentials to sign in and continue your Havenia journey.</p>
        <input
          className="w-full border rounded-lg px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          inputMode="email"
          autoComplete="email"
          type="email"
        />
        <input
          className="w-full border rounded-lg px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          autoComplete="current-password"
        />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-50 text-sm"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-sm text-gray-600">
          Don't have an account?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Register Now!
          </a>
        </p>
      </form>
    </div>
  );
}