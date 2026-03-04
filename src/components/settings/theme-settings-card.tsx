"use client";

import { Laptop2, MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const options = [
  { value: "system", label: "System", icon: Laptop2 },
  { value: "light", label: "Light", icon: SunMedium },
  { value: "dark", label: "Dark", icon: MoonStar },
] as const;

export function ThemeSettingsCard() {
  const { theme, setTheme } = useTheme();

  return (
    <Card className="glass-panel border-border/60 bg-card/55">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Appearance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-3">
          {options.map((option) => {
            const Icon = option.icon;
            const isActive = theme === option.value;
            return (
              <Button
                key={option.value}
                type="button"
                variant="outline"
                onClick={() => setTheme(option.value)}
                className={cn(
                  "justify-start gap-2 rounded-xl border-border/70 bg-background/60",
                  isActive && "border-primary/60 bg-primary/10 text-primary"
                )}
              >
                <Icon className="size-4" />
                {option.label}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
