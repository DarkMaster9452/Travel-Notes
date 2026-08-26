"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { joinGroupAction, leaveGroupAction } from "@/app/(app)/people/actions";
import { useToast } from "@/components/sq/toast";

/** Join or leave, and copy the invite link — which is the whole membership UI. */
export function GroupMembership({
  slug,
  joined,
  isOwner,
}: {
  slug: string;
  joined: boolean;
  isOwner?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();

  if (!joined) {
    return (
      <button
        type="button"
        className="sq-btn sq-btn-primary"
        disabled={pending}
        onClick={() =>
          start(() => {
            void joinGroupAction(slug).then((result) => {
              if (!result.ok) return toast(result.message ?? "That would not join.", "stamp");
              router.refresh();
            });
          })
        }
      >
        {pending ? "Joining…" : "Join this group"}
      </button>
    );
  }

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <button
        type="button"
        className="sq-btn sq-btn-ghost sq-btn-sm"
        onClick={() => {
          void navigator.clipboard
            ?.writeText(`${window.location.origin}/people/groups/${slug}`)
            .then(() => toast("Invite link copied."))
            .catch(() => toast("Copy the address bar — the clipboard refused.", "stamp"));
        }}
      >
        Copy invite link
      </button>
      <button
        type="button"
        className="sq-btn sq-btn-outline sq-btn-sm"
        disabled={pending}
        onClick={() =>
          start(() => {
            void leaveGroupAction(slug).then((result) => {
              if (!result.ok) return toast(result.message ?? "That would not leave.", "stamp");
              toast("Left the group.");
              router.push("/people?tab=groups");
            });
          })
        }
      >
        {isOwner ? "Leave (you own it)" : "Leave"}
      </button>
    </div>
  );
}
