import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@/lib/polyfills";
import { LangProvider } from "@/hooks/useLang";
import RandomFavicon from "@/components/RandomFavicon";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "The Intranet",
  description: "MechWarrior companion app for units, cards and drafts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <RandomFavicon />
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
