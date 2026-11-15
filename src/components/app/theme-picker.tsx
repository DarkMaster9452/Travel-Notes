"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useState, useTransition } from "react";

import { useT } from "@/components/i18n";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "SYSTEM", icon: Monitor, key: "system" },
  { value: "LIGHT", icon: Sun, key: "light" },
  { value: "DARK", icon: Moon, key: "dark" },
] as const;

/**
 * Three choices, saved the moment one is pressed. The page repaints at once
 * by changing `data-theme` on `<html>`, which is where the root layout stamps
 * the stored value on the next load.
 */
export function ThemePicker({
  current,
  save,
}: {
  current: string;
  save: (value: string) => Promise<{ ok: boolean }>;
}) {
  const t = useT();
  const [value, setValue] = useState(current);
  const [, start] = useTransition();
  const toast = useToast();

  return (
    <div
      role="radiogroup"
      aria-label={t.theme.palette}
      className="inline-flex max-w-full flex-wrap gap-1 rounded-control bg-surface-sunken p-1"
    >
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const on = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => {
              setValue(option.value);
              document.documentElement.dataset.theme = option.value.toLowerCase();
              start(() => {
                void save(option.value).then((result) => {
                  if (!result.ok) toast(t.app.theme.failed, "error");
                });
              });
            }}
            className={cn(
              "inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xs px-3 text-body-sm font-medium transition-colors duration-fast",
              on ? "bg-surface font-semibold text-text shadow-1" : "text-muted hover:text-text",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {t.app.theme[option.key]}
          </button>
        );
      })}
    </div>
  );
}
