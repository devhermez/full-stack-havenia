// components/ResponsiveNav.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Props = {
  authed?: boolean;
  user?: { role?: string | null } | null;
  onSignOut?: () => void;
};

export default function ResponsiveNav({ authed, user, onSignOut }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="top-0 z-40 text-white bg-transparent pt-4 pl-2 pr-2">
      <div className="mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="font-semibold">
          <img className="w-[80px]" src="/image.png" alt="" />
        </Link>

        {/* Desktop / Tablet */}
        <nav className="hidden md:flex items-center gap-4 text-sm md:pr-4">
          <Link href="/home" className="hover:underline">
            Home
          </Link>
          <Link href="/menu" className="hover:underline">
            Menu
          </Link>
          <Link href="/activities" className="hover:underline">
            Activities
          </Link>
          <Link href="/rooms" className="hover:underline">
            Rooms
          </Link>
          <Link href="/cart" className="hover:underline">
            Cart
          </Link>
          {user?.role === "admin" && (
            <Link href="/admin" className="rounded-lg border px-3 py-1">
              Admin
            </Link>
          )}
          {authed ? (
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
          aria-controls="mobile-menu"
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
          {/* Backdrop (behind panel) */}
          <div
            aria-label="Close menu backdrop"
            className="absolute inset-0 bg-black/40 z-0"
            onClick={() => setOpen(false)}
          />

          {/* Panel (above backdrop) */}
          <div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            className="relative z-10 h-screen w-screen text-black bg-white shadow-xl p-6 flex flex-col gap-3 animate-[slideIn_.2s_ease-out]"
            onClick={(e) => e.stopPropagation()} // prevent backdrop click
          >
            <div className="flex items-center justify-between mb-2">
              <Link href="/">
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
            <Link href="/home" onClick={() => setOpen(false)} className="py-2">
              Home
            </Link>
            <Link href="/menu" onClick={() => setOpen(false)} className="py-2">
              Menu
            </Link>
            <Link
              href="/activities"
              onClick={() => setOpen(false)}
              className="py-2"
            >
              Activities
            </Link>
            <Link href="/rooms" onClick={() => setOpen(false)} className="py-2">
              Rooms
            </Link>
            <Link href="/cart" onClick={() => setOpen(false)} className="py-2">
              Cart
            </Link>

            {authed && (
              <Link
                href="/me/profile"
                onClick={() => setOpen(false)}
                className="py-2"
              >
                Profile
              </Link>
            )}

            {user?.role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="py-2 rounded-lg border px-3"
              >
                Admin
              </Link>
            )}

            {authed ? (
              <>
                <button
                  onClick={() => {
                    onSignOut?.();
                    setOpen(false);
                  }}
                  className="mt-2 rounded-lg border px-3 py-2 text-left"
                >
                  Sign out
                </button>
              </>
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
