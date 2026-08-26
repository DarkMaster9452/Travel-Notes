"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  createScheduleAction,
  unscheduleAction,
  updateScheduleAction,
} from "@/app/admin/actions";
import { SqModal } from "@/components/sq/modal";
import { useToast } from "@/components/sq/toast";

export type SlotRow = {
  key: string;
  label: string;
  opensLabel: string;
  dates: string;
  state: "past" | "live" | "future";
  booking: { id: string; questId: string; title: string; where: string; audience: string } | null;
};

export type QuestOption = { id: string; title: string; where: string };

/**
 * Assign a quest to a slot.
 *
 * The slot itself is never edited: the product promises Monday 06:00 and the
 * 1st, so what an admin picks is *which* quest goes in a week that already
 * exists. Moving a quest to a different week is a clear and a book, which is
 * two decisions and reads as two.
 */
export function SqSlotEditor({
  period,
  slot,
  quests,
}: {
  period: "WEEKLY" | "MONTHLY";
  slot: SlotRow;
  quests: QuestOption[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  return (
    <>
      <button
        type="button"
        className="sq-btn sq-btn-ghost sq-btn-sm"
        onClick={() => setOpen(true)}
        disabled={slot.state === "past" && !slot.booking}
      >
        {slot.booking ? "Change" : "Book"}
      </button>

      {open ? (
        <SqModal title={`${slot.label} · ${slot.dates}`} onClose={() => setOpen(false)}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              data.set("period", period);
              data.set("slotKey", slot.key);
              if (slot.booking) data.set("id", slot.booking.id);

              start(() => {
                const action = slot.booking ? updateScheduleAction : createScheduleAction;
                void action(data).then((result) => {
                  toast(result.message ?? (result.ok ? "Saved." : "That would not save."), result.ok ? "plain" : "stamp");
                  if (result.ok) {
                    setOpen(false);
                    router.refresh();
                  }
                });
              });
            }}
          >
            <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--ink-2)", marginBottom: 16 }}>
              Opens {slot.opensLabel}. Only published quests can be booked — the action refuses an
              unpublished one, so it is not offered here either.
            </p>

            <label className="sq-field" style={{ marginBottom: 14 }}>
              <span className="sq-label">Quest</span>
              <select className="sq-select" name="questId" defaultValue={slot.booking?.questId ?? ""} required>
                <option value="">Pick one</option>
                {quests.map((quest) => (
                  <option key={quest.id} value={quest.id}>
                    {quest.title} · {quest.where}
                  </option>
                ))}
              </select>
            </label>

            <label className="sq-field" style={{ marginBottom: 18 }}>
              <span className="sq-label">Lowest plan that sees it</span>
              <select className="sq-select" name="audience" defaultValue={slot.booking?.audience ?? "FREE"}>
                <option value="FREE">Everyone</option>
                <option value="EXPLORER">Explorer and up</option>
                <option value="ULTRA">Ultra only</option>
              </select>
            </label>

            <div style={{ display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}>
              {slot.booking ? (
                <button
                  type="button"
                  className="sq-btn sq-btn-stamp sq-btn-sm"
                  disabled={pending}
                  onClick={() =>
                    start(() => {
                      void unscheduleAction(slot.booking!.id).then((result) => {
                        toast(result.message ?? (result.ok ? "Cleared." : "That would not clear."), result.ok ? "plain" : "stamp");
                        if (result.ok) {
                          setOpen(false);
                          router.refresh();
                        }
                      });
                    })
                  }
                >
                  Clear the slot
                </button>
              ) : (
                <span />
              )}
              <button type="submit" className="sq-btn sq-btn-primary sq-btn-sm" disabled={pending}>
                {pending ? "Saving…" : slot.booking ? "Save the change" : "Book it"}
              </button>
            </div>
          </form>
        </SqModal>
      ) : null}
    </>
  );
}
