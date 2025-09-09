import "@/app/globals.css";
import type { ReactNode } from "react";
import Providers from "@/components/Providers";
import CartProvider from "@/components/cart/CartProvider";
import { FaLinkedin, FaGithub } from "react-icons/fa";
import { FiGlobe } from "react-icons/fi";


export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <CartProvider>
          <main className="bg-white">{children}</main>
          <footer className="mx-auto min-w-screen text-center max-w-5xl px-4 py-10 text-sm text-black bg-white md:text-sm lg:text-md flex justify-center items-center gap-2">
             <p>© 2025 Hermez. All rights reserved. </p>
      <a href="https://www.linkedin.com/in/kim-hermes-buendia-0605b3303/" className="text-blue-600">
        <FaLinkedin  />
      </a>
      <a href="https://github.com/devhermez " className="text-blue-600">
        <FaGithub  />
      </a>
      <a href="https://hermez.dev/" className="text-blue-600">
        <FiGlobe />
      </a>
          </footer>
          </CartProvider>
        </Providers>
      </body>
    </html>
  );
}
