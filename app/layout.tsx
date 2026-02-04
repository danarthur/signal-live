import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SessionProvider } from "@/components/providers/SessionContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DanielOS",
  description: "The Operating System for Daniel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-screen overflow-hidden flex bg-background text-surface-900`}
      >
        <SessionProvider>
          {/* Japandi Ambient Background */}
          <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
            <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-accent-sage/5 blur-[120px]" />
            <div className="absolute top-[40%] -right-[10%] w-[60%] h-[60%] rounded-full bg-accent-clay/5 blur-[120px]" />
          </div>

          <Sidebar />

          <main className="flex-1 flex flex-col min-w-0">
            <Header />
            <div className="flex-1 overflow-auto p-4 md:p-8">{children}</div>
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}