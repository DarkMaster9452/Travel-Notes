"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createGroupAction } from "@/app/(app)/people/actions";
import { useToast } from "@/components/sq/toast";

/** Start a group. Two fields, because a group is two fields and a roster. */
export function GroupStarter() {
  const router = useRouter();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="sq-tinted sq-pad-sm"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        start(() => {
          void createGroupAction(data).then((result) => {
            if (!result.ok) {
              setError(result.message ?? "That would not save.");
              return;
            }
            setError(null);
            toast("Group started. Send the link to whoever you walk with.");
            router.push(`/people/groups/${result.slug}`);
          });
        });
      }}
    >
      <h2 className="sq-h2" style={{ fontSize: 19, marginBottom: 6 }}>
        Start a group
      </h2>
      <p style={{ fontSize: 13, lineHeight: 1.55, color: "var(--ink-2)", marginBottom: 14 }}>
        Whoever you send the link to is in it. The board is the product&rsquo;s own board, filtered
        to the roster.
      </p>

      <label className="sq-field" style={{ marginBottom: 12 }}>
        <span className="sq-label">Name</span>
        <input className="sq-input" name="name" required maxLength={60} placeholder="Tuesday nights" />
      </label>

      <label className="sq-field" style={{ marginBottom: 14 }}>
        <span className="sq-label">One line about it</span>
        <input className="sq-input" name="blurb" maxLength={240} placeholder="Short ones after work, all year." />
      </label>

      {error ? <p className="sq-error" style={{ marginBottom: 12 }}>{error}</p> : null}

      <button type="submit" className="sq-btn sq-btn-primary sq-btn-block" disabled={pending}>
        {pending ? "Starting…" : "Start it"}
      </button>
    </form>
  );
}
