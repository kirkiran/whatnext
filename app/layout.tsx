import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WhatNext",
  description: "Decide what to do next when your day gets messy",
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
