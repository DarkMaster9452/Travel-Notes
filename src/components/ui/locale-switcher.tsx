"use client";

import { Check, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { setLocaleAction } from "@/app/locale-actions";
import { useI18n } from "@/components/i18n";
import { buttonVariants } from "@/components/ui/button";
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from "@/components/ui/dropdown";
import { LOCALES } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * SK / EN / DE, on every page a visitor reads before signing in. The choice is
 * stored by a server action (a cookie, and the account when there is one) and
 * the page is re-rendered in place.
 */
export function LocaleSwitcher({ className }: { className?: string }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Dropdown>
      <DropdownTrigger
        aria-label={t.ui.language}
        disabled={pending}
        className={cn(buttonVariants({ variant: "ghost", size: "md" }), "px-3", className)}
      >
        <Globe aria-hidden="true" />
        <span className="uppercase">{locale}</span>
      </DropdownTrigger>
      <DropdownContent align="end">
        {LOCALES.map((option) => (
          <DropdownItem
            key={option.id}
            lang={option.id}
            data-state={option.id === locale ? "checked" : "unchecked"}
            onSelect={() => {
              if (option.id === locale) return;
              start(async () => {
                await setLocaleAction(option.id);
                router.refresh();
              });
            }}
          >
            <span className="flex-1">{option.label}</span>
            {option.id === locale ? <Check aria-hidden="true" /> : null}
          </DropdownItem>
        ))}
      </DropdownContent>
    </Dropdown>
  );
}
