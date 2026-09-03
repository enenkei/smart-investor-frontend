"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Palette, Check, Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export const THEMES = [
  {
    id: "dark",
    name: "Dark",
    category: "Dark",
    primary: "oklch(0.70 0.19 23.19)",
    accent: "oklch(0.68 0.18 252.26)",
    background: "oklch(0 0 0)",
    description: "Deep OLED black & orange pulse",
  },
  {
    id: "light",
    name: "Light",
    category: "Light",
    primary: "oklch(0.65 0.24 26.97)",
    accent: "oklch(0.56 0.24 260.82)",
    background: "oklch(1.00 0 0)",
    description: "High-contrast clean daylight",
  },
  {
    id: "nord",
    name: "Nord",
    category: "Dark",
    primary: "oklch(0.72 0.10 220)",
    accent: "oklch(0.68 0.11 200)",
    background: "oklch(0.25 0.03 240)",
    description: "Polar night & arctic ice blue",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    category: "Dark",
    primary: "oklch(0.86 0.28 142)",
    accent: "oklch(0.82 0.20 195)",
    background: "oklch(0.08 0.02 145)",
    description: "Terminal matrix lime & laser cyan",
  },
  {
    id: "sunset",
    name: "Sunset",
    category: "Dark",
    primary: "oklch(0.68 0.20 340)",
    accent: "oklch(0.72 0.20 30)",
    background: "oklch(0.20 0.05 320)",
    description: "Midnight plum & dusk magenta",
  },
  {
    id: "sepia",
    name: "Sepia",
    category: "Light",
    primary: "oklch(0.48 0.13 50)",
    accent: "oklch(0.55 0.15 65)",
    background: "oklch(0.96 0.02 85)",
    description: "Vintage parchment & coffee amber",
  },
  {
    id: "forest",
    name: "Forest",
    category: "Light",
    primary: "oklch(0.42 0.14 145)",
    accent: "oklch(0.50 0.12 165)",
    background: "oklch(0.97 0.015 140)",
    description: "Deep pine & calming sage linen",
  },
  {
    id: "royal",
    name: "Royal",
    category: "Light",
    primary: "oklch(0.50 0.27 290)",
    accent: "oklch(0.60 0.24 275)",
    background: "oklch(0.96 0.025 295)",
    description: "Imperial amethyst & lavender",
  },
] as const;

export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const currentTheme = THEMES.find((t) => t.id === theme) || THEMES[0];

  if (!mounted) {
    return (
      <button
        aria-label="Select color theme"
        className={cn(
          "p-2 text-muted-foreground hover:text-foreground transition-colors relative rounded-md",
          className
        )}
      >
        <Palette className="w-4 h-4 opacity-70" />
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={`Current theme: ${currentTheme.name}. Click to change color theme`}
          className={cn(
            "p-2 text-muted-foreground hover:text-foreground transition-all duration-200 relative rounded-md hover:bg-muted/80 flex items-center gap-1.5 group outline-none",
            className
          )}
        >
          <Palette className="w-4 h-4 transition-transform group-hover:scale-110 group-hover:text-primary" />
          <span
            className="w-2 h-2 rounded-full ring-1 ring-border shadow-xs transition-transform group-hover:scale-125"
            style={{ backgroundColor: currentTheme.primary }}
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64 p-2 bg-popover/95 backdrop-blur-md border border-border shadow-xl font-mono text-xs rounded-lg animate-in fade-in-0 zoom-in-95"
      >
        <DropdownMenuLabel className="px-2 py-1.5 flex items-center justify-between text-muted-foreground">
          <span className="font-bold tracking-wider uppercase text-[10px] flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-primary" />
            Color Themes
          </span>
          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-foreground font-semibold">
            {THEMES.length}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1" />

        <div className="grid gap-1 py-1">
          {THEMES.map((t) => {
            const isSelected = theme === t.id;
            return (
              <DropdownMenuItem
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  "cursor-pointer flex items-center justify-between px-2.5 py-2 rounded-md transition-all duration-150 group",
                  isSelected
                    ? "bg-primary/15 text-foreground font-semibold"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2.5">
                  {/* Color Swatch Preview Pill */}
                  <div
                    className="w-4 h-4 rounded-full border border-border flex items-center justify-center relative overflow-hidden shrink-0 shadow-xs"
                    style={{ backgroundColor: t.background }}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: t.primary }}
                    />
                    <div
                      className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: t.accent }}
                    />
                  </div>

                  <div className="flex flex-col">
                    <span className="text-xs font-bold leading-none tracking-tight">
                      {t.name}
                    </span>
                    <span className="text-[9px] text-muted-foreground/75 leading-tight mt-0.5">
                      {t.category}
                    </span>
                  </div>
                </div>

                {isSelected ? (
                  <Check className="w-3.5 h-3.5 text-primary shrink-0 animate-in fade-in zoom-in-75" />
                ) : (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: t.primary }}
                    />
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: t.accent }}
                    />
                  </div>
                )}
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
