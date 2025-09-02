"use client";

import { useEffect, useMemo, useState } from "react";
import AdminResponsiveNav from "./AdminResponsiveNav";
import { api, setAuthToken } from "@/lib/api";
import { getToken, clearToken } from "@/lib/auth";
import type { AxiosError } from "axios";

type MeResponse = {
  user: {
    id: string;
    email: string;
    name?: string | null;
    role?: string | null; // "admin" | "staff" | "user"
  };
};

export default function AdminNav() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<MeResponse["user"] | null>(null);
  const authed = useMemo(() => !!user, [user]);

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
    // optionally redirect: window.location.href = "/login";
  }

  if (!mounted) return null;

  return <AdminResponsiveNav authed={authed} user={user} onSignOut={onSignOut} />;
}