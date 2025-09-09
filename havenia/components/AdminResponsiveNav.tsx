"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Props = {
  authed?: boolean;
  user?: { role?: string | null } | null;
  onSignOut?: () => void;
};

export default function AdminResponsiveNav({ authed, user, onSignOut }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isAdminish = user?.role === "admin" || user?.role === "staff";

  return (
    <header className="top-0 z-40 text-black bg-transparent pt-4 pl-2 pr-2">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link
          href="/home"
          className="font-semibold"
          aria-label="Havenia Admin"
        >
          <img className="w-[80px]" src="/image2.png" alt="" />
        </Link>

        {/* Desktop / Tablet */}
        <nav className="hidden md:flex items-center gap-4 text-sm ">
          <Link href="/admin" className="hover:underline">
            Dashboard
          </Link>
          <Link href="/admin/menu" className="hover:underline">
            Menu
          </Link>
          <Link href="/admin/users" className="hover:underline">
            Users
          </Link>
          <Link href="/admin/reservations" className="hover:underline">
            Reservations
          </Link>
          <Link href="/admin/bookings" className="hover:underline">
            Bookings
          </Link>

          {isAdminish ? (
            <>
              <Link href="/me/profile" className="hover:underline">
                Profile
              </Link>
              <button
                onClick={onSignOut}
                className="rounded-lg border px-3 py-1"
              >
                Sign out
              </button>
            </>
          ) : authed ? (
            <Link href="/" className="rounded-lg border px-3 py-1">
              Exit admin
            </Link>
          ) : (
            <Link href="/login" className="rounded-lg border px-3 py-1">
              Sign in
            </Link>
          )}
        </nav>

        {/* Mobile: hamburger */}
        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center rounded-md p-2 border"
          aria-label="Open menu"
          aria-controls="admin-mobile-menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M4 6h16M4 12h16M4 18h16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Mobile pop-up / slide-over */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            aria-label="Close menu backdrop"
            className="absolute inset-0 bg-black/40 z-0"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div
            id="admin-mobile-menu"
            role="dialog"
            aria-modal="true"
            className="relative z-10 h-screen w-screen text-black bg-white shadow-xl p-6 flex flex-col gap-3 animate-[slideIn_.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <Link href="/admin" aria-label="Havenia Admin">
                <img className="w-[80px]" src="/image2.png" alt="" />
              </Link>
              <button
                aria-label="Close menu"
                className="rounded-md p-2 border"
                onClick={() => setOpen(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {/* Links */}
            <Link href="/admin" onClick={() => setOpen(false)} className="py-2">
              Dashboard
            </Link>
            <Link
              href="/admin/menu"
              onClick={() => setOpen(false)}
              className="py-2"
            >
              Menu
            </Link>
            <Link
              href="/admin/users"
              onClick={() => setOpen(false)}
              className="py-2"
            >
              Users
            </Link>
            <Link
              href="/admin/reservations"
              onClick={() => setOpen(false)}
              className="py-2"
            >
              Reservations
            </Link>

            <Link
              href="/admin/bookings"
              onClick={() => setOpen(false)}
              className="py-2"
            >
              Bookings
            </Link>

            {isAdminish && (
              <Link
                href="/me/profile"
                onClick={() => setOpen(false)}
                className="py-2"
              >
                Profile
              </Link>
            )}

            {isAdminish ? (
              <button
                onClick={() => {
                  onSignOut?.();
                  setOpen(false);
                }}
                className="mt-2 rounded-lg border px-3 py-2 text-left"
              >
                Sign out
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="mt-2 rounded-lg border px-3 py-2"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
