import type { Metadata, Viewport } from "next";
import { Onest, Geist_Mono } from "next/font/google";
import "./globals.css";

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "IrisGuard",
  description:
    "Biometric access that shows its work — the frame it looked at, what it found, and how sure it is.",
};

export const viewport: Viewport = {
  themeColor: "#0e0f13",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${onest.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full bg-ink text-text antialiased">
        <a
          href="#main"
          className="sr-only rounded-[var(--r-sm)] focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-raised focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:shadow-[var(--lift-2)]"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
