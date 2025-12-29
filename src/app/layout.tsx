import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from "./providers";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Wrapper } from "./wrapper";
import { Toaster } from "@/components/ui/sonner";
import { ViewTransition } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Search Arena",
  description: "Compare search results from different providers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TRPCProvider>
          <ReactQueryDevtools initialIsOpen={false} />
          <ViewTransition>
            <Wrapper>{children}</Wrapper>
          </ViewTransition>
        </TRPCProvider>
        <Toaster />
      </body>
    </html>
  );
}
