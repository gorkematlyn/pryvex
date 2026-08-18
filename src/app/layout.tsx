import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { themeInitScript } from "@/lib/theme-script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL) : undefined,
  title: {
    default: "Pryvex — The link layer for creators",
    template: "%s · Pryvex",
  },
  description:
    "Pryvex is a unified link-in-bio, link shortener, QR code, and analytics platform built for creators and brands who want control over their distribution.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      // The theme script below sets data-theme before hydration based on
      // localStorage, which the server can't know — that intentional,
      // one-attribute mismatch is exactly what suppressHydrationWarning
      // exists for, rather than a bug to chase.
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-shadow text-alloy">{children}</body>
    </html>
  );
}
