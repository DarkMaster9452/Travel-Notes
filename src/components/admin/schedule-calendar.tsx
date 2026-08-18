"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import {
  createScheduleAction,
  unscheduleAction,
  updateScheduleAction,
} from "@/app/admin/actions";
import { Modal, Tag, useToast } from "@/components/field";
import { cn } from "@/lib/utils";

export type CalendarSlot = {
  key: string;
  label: string;
  opensLabel: string;
  state: "past" | "live" | "future";
  booked: {
    id: string;
    questId: string;
    questTitle: string;
    questLocation: string;
    audience: "FREE" | "EXPLORER" | "ULTRA";
  } | null;
};

export type QuestOption = { id: string; title: string; location: string };

type Audience = "FREE" | "EXPLORER" | "ULTRA";

const AUDIENCE_LABEL: Record<Audience, string> = {
  FREE: "Everyone",
  EXPLORER: "Explorer and up",
  ULTRA: "Ultra only",
};

/**
 * The schedule, as a calendar of slots.
 *
 * Every cell is a week or a month, never a date — the cadence is fixed
 * (Monday 06:00, the 1st at 06:00) so there is nothing to pick but *which*
 * one. A slot that already holds a quest can be edited; a slot that has
 * already opened is read-only, because unbooking the quest people are out
 * walking is a disappearance rather than an edit.
 *
 * Only one quest fits a slot. The empty state offers "Schedule", the filled
 * state offers "Edit" — there is deliberately no way to reach an "add a
 * second one" affordance, since the database would refuse it anyway.
 */
export function ScheduleCalendar({
  period,
  slots,
  quests,
}: {
  period: "WEEKLY" | "MONTHLY";
  slots: CalendarSlot[];
  quests: QuestOption[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = React.useState<CalendarSlot | null>(null);
  const [pending, setPending] = React.useState(false);

  async function submit(formData: FormData) {
    setPending(true);
    const booked = editing?.booked;

    if (booked) {
      formData.set("id", booked.id);
    } else {
      formData.set("period", period);
      formData.set("slotKey", editing!.key);
    }

    const result = await (booked
      ? updateScheduleAction(formData)
      : createScheduleAction(formData)
    ).catch(() => null);
    setPending(false);

    if (!result?.ok) {
      toast({
        title: "Not scheduled.",
        detail: result?.message ?? "Try again in a moment.",
        tone: "warm",
      });
      return;
    }
    toast({ title: booked ? "Slot updated." : "Scheduled.", detail: result.message });
    setEditing(null);
    router.refresh();
  }

  async function clear(slot: CalendarSlot) {
    if (!slot.booked) return;
    setPending(true);
    const result = await unscheduleAction(slot.booked.id).catch(() => null);
    setPending(false);

    if (!result?.ok) {
      toast({
        title: "Not cleared.",
        detail: result?.message ?? "Try again in a moment.",
        tone: "warm",
      });
      return;
    }
    toast({ title: "Slot cleared.", detail: result.message });
    setEditing(null);
    router.refresh();
  }

  return (
    <>
      <div className="slot-grid">
        {slots.map((slot) => {
          const locked = slot.state !== "future";
          return (
            <button
              key={slot.key}
              type="button"
              className={cn("slot", `is-${slot.state}`, slot.booked && "filled")}
              onClick={() => setEditing(slot)}
              aria-label={`${slot.label} — ${slot.booked ? slot.booked.questTitle : "empty"}`}
            >
              <span className="slot-head">
                <b>{slot.label}</b>
                {slot.state === "live" && <Tag tone="warm">Live</Tag>}
                {slot.state === "past" && <span className="slot-flag">Closed</span>}
              </span>
              <span className="slot-opens">{slot.opensLabel}</span>

              {slot.booked ? (
                <span className="slot-quest">
                  <b>{slot.booked.questTitle}</b>
                  <span>{slot.booked.questLocation}</span>
                  {slot.booked.audience !== "FREE" && (
                    <em>{AUDIENCE_LABEL[slot.booked.audience]}</em>
                  )}
                </span>
              ) : (
                <span className={cn("slot-empty", locked && "muted")}>
                  {locked ? "Nothing was scheduled" : "Empty — click to schedule"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing ? editing.label : ""}
        description={
          editing
            ? editing.state === "future"
              ? `Opens ${editing.opensLabel}. One quest per slot — picking another replaces this one.`
              : `Opened ${editing.opensLabel}. This slot has already run, so it can only be read.`
            : ""
        }
      >
        {editing && (
          <form action={submit} className="modal-form">
            <div className="admin-field">
              <label htmlFor="schedule-quest">Quest</label>
              <select
                id="schedule-quest"
                name="questId"
                className="input"
                defaultValue={editing.booked?.questId ?? ""}
                disabled={editing.state !== "future"}
                required
              >
                <option value="" disabled>
                  Pick a quest…
                </option>
                {quests.map((quest) => (
                  <option key={quest.id} value={quest.id}>
                    {quest.title} — {quest.location}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-field">
              <label htmlFor="schedule-audience">Who sees it</label>
              <select
                id="schedule-audience"
                name="audience"
                className="input"
                defaultValue={editing.booked?.audience ?? "FREE"}
                disabled={editing.state !== "future"}
              >
                <option value="FREE">Everyone</option>
                <option value="EXPLORER">Explorer and up</option>
                <option value="ULTRA">Ultra only</option>
              </select>
            </div>

            {editing.state === "future" ? (
              <div className="flex flex-wrap gap-2">
                <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
                  {pending ? "Saving…" : editing.booked ? "Update slot" : "Schedule it"}
                </button>
                {editing.booked && (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    disabled={pending}
                    onClick={() => clear(editing)}
                  >
                    Clear slot
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setEditing(null)}
                  disabled={pending}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setEditing(null)}
              >
                Close
              </button>
            )}
          </form>
        )}
      </Modal>
    </>
  );
}
