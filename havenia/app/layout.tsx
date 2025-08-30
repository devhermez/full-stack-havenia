import "@/app/globals.css";
import type { ReactNode } from "react";
import Providers from "@/components/Providers";
import CartProvider from "@/components/cart/CartProvider";


export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <CartProvider>
          <main>{children}</main>
          <footer className="mx-auto text-center max-w-5xl px-4 py-10 text-sm text-neutral-500 bg-white">
            © {new Date().getFullYear()} Havenia
          </footer>
          </CartProvider>
        </Providers>
      </body>
    </html>
  );
}
