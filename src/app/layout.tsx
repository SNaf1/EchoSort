import type { Metadata } from "next";
import { JetBrains_Mono, Sora } from "next/font/google";

import { AppHeader } from "@/components/layout/app-header";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";

import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: ["/favicon.ico"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sora.variable} ${jetbrainsMono.variable} antialiased`}>
        <ThemeProvider>
          <TooltipProvider>
            <div className="relative min-h-screen bg-background">
              <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(170deg,rgba(8,10,9,0.18),transparent_32%),linear-gradient(0deg,rgba(8,10,9,0.06),rgba(8,10,9,0.06))] dark:bg-[linear-gradient(150deg,rgba(9,14,13,0.68),rgba(11,13,14,0.72))]" />
              <AppHeader />
              <main>{children}</main>
            </div>
            <Toaster richColors closeButton />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
