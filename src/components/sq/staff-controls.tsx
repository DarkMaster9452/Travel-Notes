"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { endSessionsAction, revokeStaffAction } from "@/app/admin/actions";
import { useToast } from "@/components/sq/toast";

/**
 * The two things an owner can do to somebody's keys.
 *
 * Ending sessions is one press, because it is the thing you want at two in the
 * morning. Revoking asks first, because it is the thing you cannot undo from
 * here — granting the role back needs a database prompt.
 */
export function SqStaffControls({
  userId,
  name,
  isSelf,
  lastOwner,
  canRevoke,
}: {
  userId: string;
  name: string;
  isSelf: boolean;
  lastOwner: boolean;
  /** Only an owner may take a role away. Ending a session is reversible. */
  canRevoke: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [asking, setAsking] = useState(false);
  const [pending, start] = useTransition();

  return (
    <span style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
      <button
        type="button"
        className="sq-btn sq-btn-ghost sq-btn-sm"
        disabled={pending}
        onClick={() =>
          start(() => {
            void endSessionsAction(userId).then((result) => {
              toast(result.message ?? (result.ok ? "Done." : "That did not work."), result.ok ? "plain" : "stamp");
              router.refresh();
            });
          })
        }
      >
        End sessions
      </button>

      {!canRevoke || isSelf || lastOwner ? (
        <span className="sq-mono" style={{ fontSize: 10, color: "var(--ink-3)", alignSelf: "center" }}>
          {isSelf ? "your own keys" : lastOwner ? "last owner" : "owner only"}
        </span>
      ) : asking ? (
        <>
          <button type="button" className="sq-btn sq-btn-ghost sq-btn-sm" onClick={() => setAsking(false)}>
            Keep
          </button>
          <button
            type="button"
            className="sq-btn sq-btn-stamp sq-btn-sm"
            disabled={pending}
            onClick={() =>
              start(() => {
                void revokeStaffAction(userId).then((result) => {
                  toast(result.message ?? (result.ok ? "Revoked." : "That did not work."), result.ok ? "plain" : "stamp");
                  setAsking(false);
                  router.refresh();
                });
              })
            }
          >
            Revoke {name.split(" ")[0]}
          </button>
        </>
      ) : (
        <button type="button" className="sq-btn sq-btn-stamp sq-btn-sm" onClick={() => setAsking(true)}>
          Revoke
        </button>
      )}
    </span>
  );
}
