"use client";

import { useState, useTransition } from "react";

import { useToast } from "@/components/sq/toast";

const OPTIONS = [
  { value: "SYSTEM", label: "Follow the device" },
  { value: "LIGHT", label: "Paper" },
  { value: "DARK", label: "Forest" },
] as const;

/** Three choices, saved the moment one is pressed. */
export function ThemePicker({
  current,
  save,
}: {
  current: string;
  save: (value: string) => Promise<{ ok: boolean }>;
}) {
  const [value, setValue] = useState(current);
  const [, start] = useTransition();
  const toast = useToast();

  return (
    <div className="sq-seg" role="group" aria-label="Palette">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className="sq-seg-opt"
          data-on={value === option.value ? "1" : "0"}
          onClick={() => {
            setValue(option.value);
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
