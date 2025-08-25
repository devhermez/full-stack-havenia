"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, setAuthToken } from "@/lib/api";
import { getToken, clearToken } from "@/lib/auth";
import type { AxiosError } from "axios";

type Me = {
  user: {
    id: string;
    email: string;
    name?: string | null;
    role?: string | null;
  };
};

const Nav = () => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<Me["user"] | null>(null);

  useEffect(() => {
    setMounted(true);
    const t = getToken();
    if (!t) return; // not authed
    setAuthToken(t);
    (async () => {
      try {
        const { data } = await api.get<Me>("/auth/me");
        setUser(data.user);
      } catch (_e) {
        const ax = _e as AxiosError<any>;
        // if token bad, just treat as logged-out
        if ([401, 422].includes(ax.response?.status ?? 0)) {
          clearToken();
        }
      }
    })();
  }, []);

  const authed = !!user; // treat as authed only after we have a user

  const signOut = () => {
    clearToken();
    setAuthToken(null);
    setUser(null);
    router.push("/login");
  };

  // Optional: prevent SSR/client drift for the nav state
  if (!mounted) return null;

  return (
    <header className="sticky top-0 z-40 border-b bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-semibold">
          Havenia
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/menu" className="hover:underline">
            Menu
          </Link>
          <Link href="/activities" className="hover:underline">
            Activities
          </Link>
          
          {user?.role === "admin" && (
            <Link href="/admin/menu" className="rounded-lg border px-3 py-1">
              Admin
            </Link>
          )}
          {authed ? (
            <>
              <Link href="/profile" className="hover:underline">
                Profile
              </Link>
              <button onClick={signOut} className="rounded-lg border px-3 py-1">
                Sign out
              </button>
            </>
          ) : (
            <Link href="/login" className="rounded-lg border px-3 py-1">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Nav;
