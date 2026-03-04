"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Send, Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/submit", label: "Submit", icon: Send },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[96rem] items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/submit" className="font-mono text-sm font-semibold tracking-[0.14em]">
          ECHOSORT
        </Link>
        <nav className="flex items-center gap-1 rounded-full border border-border/60 bg-card/50 p-1">
          {links.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href === "/dashboard" && pathname.startsWith("/dashboard"));
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-3.5" />
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            );
          })}
        </nav>
        <Button asChild variant="outline" className="rounded-full px-3">
          <Link href="/dashboard/settings" aria-label="Open settings">
            <Settings2 className="mr-0 size-4 sm:mr-2" />
            <span className="hidden sm:inline">Settings</span>
          </Link>
        </Button>
      </div>
    </header>
  );
}
