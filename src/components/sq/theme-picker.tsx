"use client";

import { useState, useTransition } from "react";

import { useT } from "@/components/sq/i18n";
import { useToast } from "@/components/sq/toast";

const OPTIONS = [
  { value: "SYSTEM", label: "Follow the device" },
  { value: "LIGHT", label: "Light" },
  { value: "DARK", label: "Evening" },
] as const;

/** Three choices, saved the moment one is pressed. */
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
    <div className="sq-seg" role="group" aria-label={t.theme.palette}>
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className="sq-seg-opt"
          data-on={value === option.value ? "1" : "0"}
          onClick={() => {
            setValue(option.value);
            // Repaint now; the server stamps the same value on the next load.
            document
              .querySelector(".sq-shell")
              ?.setAttribute("data-theme", option.value.toLowerCase());
            start(() => {
              void save(option.value).then((result) => {
                if (!result.ok) toast("That palette would not save.", "stamp");
              });
            });
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
