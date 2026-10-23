import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gas Clearance & Treatment Certificate Draft Generator",
  description: "Web draft generator and print-ready PDF export for Gas Clearance and Treatment Certificates (Prana Argentum Corporation)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased flex flex-col min-h-screen bg-background text-foreground selection:bg-blue-500/20 selection:text-blue-900`}>
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
