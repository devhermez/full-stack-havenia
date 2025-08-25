// components/AdminGuard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, setAuthToken } from "@/lib/api";
import { getToken, clearToken } from "@/lib/auth";
import type { AxiosError } from "axios";

type Me = { user: { id: string; email: string; name?: string | null; role?: string | null } };

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const t = getToken();
    if (!t) { router.replace("/login"); return; }
    setAuthToken(t);

    (async () => {
      try {
        const { data } = await api.get<Me>("/auth/me");
        if (data.user.role !== "admin") {
          router.replace("/admin/forbidden");
          return;
        }
        setOk(true);
      } catch (e) {
        const status = (e as AxiosError).response?.status ?? 0;
        if ([401, 422].includes(status)) { clearToken(); router.replace("/login"); return; }
        router.replace("/admin/forbidden");
      }
    })();
  }, [router]);

  if (!ok) return null; // or a spinner
  return <>{children}</>;
}