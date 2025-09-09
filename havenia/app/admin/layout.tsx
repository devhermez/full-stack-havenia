// app/admin/layout.tsx
"use client";

import AdminNav from "@/components/AdminNav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top navigation */}
      <AdminNav />

      {/* Page content */}
      <main className="flex-1 px-4">
        {children}
      </main>
    </div>
  );
}