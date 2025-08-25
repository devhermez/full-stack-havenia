"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, type ReactNode } from "react";
import { getToken } from "@/lib/auth";
import { setAuthToken } from "@/lib/api";

export default function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient());
  useEffect(() => {
    setAuthToken(getToken());
  }, []);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
