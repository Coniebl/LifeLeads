import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "LifeLead - Secure Client Monitoring Portal",
  description: "Secure login for LifeLead client monitoring and tracking platform.",
};

import { AppLayoutClient } from "./AppLayoutClient";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable}`}>
      <body className="antialiased font-sans">
        <AppLayoutClient>{children}</AppLayoutClient>
      </body>
    </html>
  );
}
