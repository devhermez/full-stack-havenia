// components/ClientNav.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import ResponsiveNav from "./ResponsiveNav";
import { api, setAuthToken } from "@/lib/api";
import { getToken, clearToken } from "@/lib/auth";
import type { AxiosError } from "axios";

type MeResponse = {
  user: {
    id: string;
    email: string;
    name?: string | null;
    role?: string | null; // "admin" | "user" | ...
  };
};

export default function ClientNav() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<MeResponse["user"] | null>(null);
  const authed = useMemo(() => !!user, [user]);

  // Avoid hydration mismatch: render nothing until mounted on client
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;

    const t = getToken();
    if (!t) {
      setUser(null);
      return;
    }

    setAuthToken(t);

    (async () => {
      try {
        const { data } = await api.get<MeResponse>("/auth/me", {
          headers: { "Cache-Control": "no-cache" },
        });
        setUser(data.user ?? null);
      } catch (e) {
        const status = (e as AxiosError)?.response?.status ?? 0;
        // If token is invalid/expired, clear it so UI shows signed-out state
        if (status === 401 || status === 422) {
          clearToken();
          setUser(null);
        }
      }
    })();
  }, [mounted]);

  function onSignOut() {
    clearToken();
    setUser(null);
    // optional: hard refresh to clear any client state
    // window.location.href = "/login";
  }

  if (!mounted) return null;

  return <ResponsiveNav authed={authed} user={user} onSignOut={onSignOut} />;
}
