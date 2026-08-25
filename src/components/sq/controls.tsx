"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

/**
 * The segmented control, as links.
 *
 * Every filter in the product is a URL, not component state: a filtered table
 * is a thing people send each other, and the back button should undo a filter
 * change like it undoes anything else.
 */
export function SqSegmentedLinks({
  options,
  active,
  label,
}: {
  options: { label: string; href: string; key: string }[];
  active: string;
  label: string;
}) {
  return (
    <div className="sq-seg" role="group" aria-label={label}>
      {options.map((option) => (
        <Link
          key={option.key}
          href={option.href}
          className="sq-seg-opt"
          data-on={option.key === active ? "1" : "0"}
          scroll={false}
        >
          {option.label}
        </Link>
      ))}
    </div>
  );
}

/** A toggle that writes one search param and lets the server re-render. */
export function SqParamSelect({
  name,
  value,
  options,
  label,
}: {
  name: string;
  value: string;
  options: { value: string; label: string }[];
  label: string;
}) {
  const setParam = useSetParam();
  const [pending, start] = useTransition();

  return (
    <label className="sq-field" style={{ minWidth: 150 }}>
      <span className="sq-label">{label}</span>
      <select
        className="sq-select"
        value={value}
        disabled={pending}
        onChange={(event) => start(() => setParam(name, event.target.value))}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** A search box that writes one search param, debounced by a beat. */
export function SqParamSearch({
  name,
  value,
  placeholder,
  label,
}: {
  name: string;
  value: string;
  placeholder?: string;
  label: string;
}) {
  const setParam = useSetParam();

  return (
    <form
      className="sq-field"
      style={{ minWidth: 220, flex: 1 }}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setParam(name, String(data.get(name) ?? ""));
      }}
    >
      <span className="sq-label">{label}</span>
      <input
        className="sq-input"
        name={name}
        defaultValue={value}
        placeholder={placeholder}
        type="search"
      />
    </form>
  );
}

/** The bar those controls sit in. */
export function SqFilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="sq-tinted"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 14,
        alignItems: "flex-end",
        padding: "16px 18px",
        marginBottom: 16,
      }}
    >
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
