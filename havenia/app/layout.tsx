import "@/app/globals.css";
import type { ReactNode } from "react";
import Providers from "@/components/Providers";
import Nav from "@/components/Nav";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <main>{children}</main>
          <footer className="mx-auto text-center max-w-5xl px-4 py-10 text-sm text-neutral-500">
            © {new Date().getFullYear()} Havenia
          </footer>
        </Providers>
      </body>
    </html>
  );
}
