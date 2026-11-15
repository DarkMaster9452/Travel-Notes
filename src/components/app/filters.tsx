"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useId, useTransition, type ReactNode } from "react";

import { Field, Input, Select } from "@/components/ui/field";
import { cn } from "@/lib/utils";

/**
 * Filters that live in the URL (design/DESIGN-SYSTEM.md §7.8): a filtered list
 * is something people send each other, and the back button should undo a
 * filter like it undoes anything else.
 */

/** A select that writes one search param and lets the server re-render. */
export function ParamSelect({
  name,
  value,
  options,
  label,
  className,
}: {
  name: string;
  value: string;
  options: { value: string; label: string }[];
  label: string;
  className?: string;
}) {
  const id = useId();
  const setParam = useSetParam();
  const [pending, start] = useTransition();

  return (
    <Field label={label} htmlFor={id} className={cn("min-w-40 flex-1", className)}>
      <Select
        id={id}
        value={value}
        disabled={pending}
        onChange={(event) => start(() => setParam(name, event.target.value))}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </Field>
  );
}

/** A search box that writes one search param when submitted. */
export function ParamSearch({
  name,
  value,
  placeholder,
  label,
  className,
}: {
  name: string;
  value: string;
  placeholder?: string;
  label: string;
  className?: string;
}) {
  const id = useId();
  const setParam = useSetParam();

  return (
    <form
      role="search"
      className={cn("min-w-56 flex-1", className)}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setParam(name, String(data.get(name) ?? ""));
      }}
    >
      <Field label={label} htmlFor={id}>
        <span className="relative block">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle"
            aria-hidden="true"
          />
          <Input id={id} name={name} defaultValue={value} placeholder={placeholder} type="search" className="pl-10" />
        </span>
      </Field>
    </form>
  );
}

/** The bar those controls sit in, above a list. */
export function FilterBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-end gap-4 rounded-card bg-surface-sunken p-4", className)}>
      {children}
    </div>
  );
}

function useSetParam() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return useCallback(
    (name: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value && value !== "all") next.set(name, value);
      else next.delete(name);
      // Any filter change resets paging: page 4 of a different result set is
      // not a page anybody asked for.
      next.delete("page");
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );
}
