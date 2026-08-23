"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import {
  cheatApproveAllPendingAction,
  cheatClearRateLimitsAction,
  cheatFillSlotsAction,
  cheatGrantUltraAction,
  cheatPublishAllAction,
  cheatResealBoardsAction,
  cheatResetAllowanceAction,
  cheatRevokeSessionsAction,
  cheatSealBoardsAction,
  cheatSnapshotAction,
  cheatUnpublishAllAction,
  type CheatResult,
} from "@/app/admin/cheats";
import { Modal, useToast } from "@/components/field";
import { cn } from "@/lib/utils";

/**
 * The cheat drawer. F7, anywhere in the panel.
 *
 * Everything in here is reachable some other way — a page, a form, a row
 * action — but reaching it means knowing where it lives and clicking four
 * times. This is the same panel with the navigation taken out: type three
 * letters, press Enter.
 *
 * Two rules the list is built on:
 *
 * · Everything says what it does, in a sentence, before you press it. A menu
 *   of verbs with no consequences attached is how somebody publishes the whole
 *   catalogue meaning to publish one quest.
 * · Anything that cannot be undone by pressing something else asks first, in
 *   place, and the confirmation repeats the consequence rather than saying
 *   "are you sure".
 *
 * It is mounted from the admin layout, which is guarded by role — and every
 * action re-checks that role on the server anyway, because a server action is
 * a public endpoint and a keyboard shortcut is not a permission.
 */

type Command = {
  id: string;
  label: string;
  /** The sentence printed under the label. Always says the consequence. */
  hint: string;
  group: string;
  /** Extra words the search should match, for people who call it something else. */
  keywords?: string;
  href?: string;
  run?: () => Promise<CheatResult>;
  /** Asks in place before running. For anything with no button that undoes it. */
  confirm?: string;
};

const COMMANDS: Command[] = [
  /* ---- Go somewhere ----------------------------------------------------- */
  {
    id: "go-review",
    group: "Go",
    label: "Review deck",
    hint: "The queue, one submission at a time. Weekly and monthly proof is dealt first.",
    keywords: "queue approve decline proof",
    href: "/admin/review",
  },
  {
    id: "go-chat",
    group: "Go",
    label: "Back office",
    hint: "The staff room. One conversation, admins only, and everything said in it stays.",
    keywords: "chat room staff talk message colleagues",
    href: "/admin/chat",
  },
  {
    id: "go-submissions",
    group: "Go",
    label: "All submissions",
    hint: "The record of everything filed, filterable by verdict and cadence.",
    keywords: "filed record verdict",
    href: "/admin/submissions",
  },
  {
    id: "go-quests",
    group: "Go",
    label: "All quests",
    hint: "The catalogue, filterable — including which have ever run as a weekly or monthly.",
    keywords: "catalogue database table cadence",
    href: "/admin/quests/all",
  },
  {
    id: "go-new-quest",
    group: "Go",
    label: "Write a new quest",
    hint: "The authoring form. A quest written here is published and bookable.",
    keywords: "create author add",
    href: "/admin/quests/new",
  },
  {
    id: "go-schedule",
    group: "Go",
    label: "Schedule",
    hint: "Book which quest fills which week or month.",
    keywords: "calendar slot weekly monthly booking",
    href: "/admin/schedule",
  },
  {
    id: "go-leaderboard",
    group: "Go",
    label: "Leaderboards",
    hint: "Exactly what the members see, plus how much proof is still unread.",
    keywords: "board podium medals ranking",
    href: "/admin/leaderboard",
  },
  {
    id: "go-users",
    group: "Go",
    label: "Accounts",
    hint: "Roles, plans, allowances, stickers and deletions.",
    keywords: "users people accounts roles plans",
    href: "/admin/users",
  },
  {
    id: "go-locations",
    group: "Go",
    label: "The map",
    hint: "Every place a quest is set, with what has been filed against it.",
    keywords: "places map geography",
    href: "/admin/locations",
  },
  {
    id: "go-database",
    group: "Go",
    label: "Database",
    hint: "Read-only row counts and the newest rows of any table.",
    keywords: "tables rows sql storage",
    href: "/admin/database",
  },
  {
    id: "go-revenue",
    group: "Go",
    label: "Revenue",
    hint: "Subscriptions, plans and what they are worth.",
    keywords: "money stripe billing subscriptions",
    href: "/admin/revenue",
  },

  /* ---- The queue -------------------------------------------------------- */
  {
    id: "approve-all",
    group: "The queue",
    label: "Approve everything pending",
    hint: "Marks every waiting submission approved and writes each quest into its author's history. Nobody reads them.",
    keywords: "clear queue bulk verdict",
    run: cheatApproveAllPendingAction,
    confirm: "Every pending submission is approved without being read, and each one lands in somebody's history and on the boards.",
  },

  /* ---- Cadence ---------------------------------------------------------- */
  {
    id: "fill-slots",
    group: "Cadence",
    label: "Fill the empty slots",
    hint: "Books a published quest into every unbooked week and month in view. Existing bookings are left alone.",
    keywords: "schedule book weekly monthly calendar seed",
    run: cheatFillSlotsAction,
  },
  {
    id: "seal-boards",
    group: "Cadence",
    label: "Seal the closed boards",
    hint: "Hands out the medals for every board whose window has shut, rather than waiting for the first reader to trigger it.",
    keywords: "medals podium awards leaderboard",
    run: cheatSealBoardsAction,
  },
  {
    id: "reseal-boards",
    group: "Cadence",
    label: "Tear up and re-seal the podiums",
    hint: "Deletes every recent medal and works the boards out again from the submissions as they stand now.",
    keywords: "recompute medals awards fix wrong podium",
    run: cheatResealBoardsAction,
    confirm: "Medals people already hold are deleted. Recomputing may not give them back — the board is rebuilt from today's data, not the day it closed.",
  },

  /* ---- The catalogue ---------------------------------------------------- */
  {
    id: "publish-all",
    group: "The catalogue",
    label: "Publish every quest",
    hint: "Puts the whole authored catalogue on the shelf, browsable and bookable.",
    keywords: "publish visible shelf all",
    run: cheatPublishAllAction,
  },
  {
    id: "unpublish-all",
    group: "The catalogue",
    label: "Unpublish every quest",
    hint: "Takes the whole catalogue off the shelf. The customer database goes empty and nothing new can be booked.",
    keywords: "hide unpublish empty shelf",
    run: cheatUnpublishAllAction,
    confirm: "The customer-facing database will show nothing at all until you publish again.",
  },

  /* ---- This account ----------------------------------------------------- */
  {
    id: "grant-ultra",
    group: "This account",
    label: "Give me Ultra",
    hint: "Writes a real active Ultra subscription on this account for a year. Stripe is never told, so no money moves.",
    keywords: "plan subscription upgrade ultra entitlement",
    run: cheatGrantUltraAction,
  },
  {
    id: "reset-allowance",
    group: "This account",
    label: "Refill my free quests",
    hint: "Sets this account's used-quest counter back to nought.",
    keywords: "quota allowance free unlock reset",
    run: cheatResetAllowanceAction,
  },
  {
    id: "clear-limits",
    group: "This account",
    label: "Clear every rate limit",
    hint: "Empties the rate-limit table for everybody — unlocks and login attempts start from zero again.",
    keywords: "throttle limit unlock testing",
    run: cheatClearRateLimitsAction,
  },
  {
    id: "revoke-sessions",
    group: "This account",
    label: "Sign everybody else out",
    hint: "Ends every session except your own. Everyone is asked to log in again.",
    keywords: "logout sessions security kick",
    run: cheatRevokeSessionsAction,
    confirm: "Every other person using the product right now is logged out mid-page.",
  },

  /* ---- Read ------------------------------------------------------------- */
  {
    id: "snapshot",
    group: "Read",
    label: "Where is everything?",
    hint: "Counts accounts, quests, slots, submissions and medals. Writes nothing.",
    keywords: "counts stats snapshot debug numbers",
    run: cheatSnapshotAction,
  },
];

const GROUPS = [...new Set(COMMANDS.map((command) => command.group))];

function matches(command: Command, query: string): boolean {
  if (!query) return true;
  const haystack =
    `${command.label} ${command.hint} ${command.group} ${command.keywords ?? ""}`.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

export function CheatMenu() {
  const router = useRouter();
  const toast = useToast();

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [cursor, setCursor] = React.useState(0);
  const [pending, setPending] = React.useState<string | null>(null);
  const [confirming, setConfirming] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<CheatResult | null>(null);

  const visible = React.useMemo(
    () =>
      GROUPS.map((group) => ({
        group,
        items: COMMANDS.filter((command) => command.group === group && matches(command, query)),
      })).filter((section) => section.items.length > 0),
    [query],
  );
  const flat = React.useMemo(() => visible.flatMap((section) => section.items), [visible]);

  /**
   * Every open starts clean.
   *
   * A half-typed query and a confirmation left armed from last time are both
   * traps — "press again to do it" surviving a close would mean the next F7
   * plus Enter fires something the reader has forgotten they aimed at. Reset
   * happens here, on the transition, rather than in an effect watching `open`:
   * closing is an event, not a state to synchronise against.
   */
  const setDrawer = React.useCallback((next: boolean) => {
    setOpen(next);
    if (next) return;
    setQuery("");
    setCursor(0);
    setConfirming(null);
    setResult(null);
  }, []);

  // F7 anywhere in the panel. Bound to the window rather than a container so
  // it works with focus inside a form, which is where an admin usually is.
  // Re-bound when `open` changes rather than reading it through a ref: it
  // happens twice per visit, and a ref written during render is a lie about
  // when the value was true.
  React.useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "F7") return;
      event.preventDefault();
      setDrawer(!open);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setDrawer]);

  const close = React.useCallback(() => setDrawer(false), [setDrawer]);

  const fire = React.useCallback(
    async (command: Command) => {
      if (command.href) {
        setDrawer(false);
        router.push(command.href);
        return;
      }
      if (!command.run) return;

      if (command.confirm && confirming !== command.id) {
        setConfirming(command.id);
        return;
      }

      setConfirming(null);
      setPending(command.id);
      setResult(null);
      const outcome = await command.run().catch(() => null);
      setPending(null);

      const value: CheatResult = outcome ?? {
        ok: false,
        message: "That didn't go through. Nothing was changed.",
      };
      setResult(value);
      toast({
        title: value.ok ? command.label : "Not done.",
        detail: value.message,
        tone: value.ok ? "pine" : "warm",
      });
      router.refresh();
    },
    [confirming, router, setDrawer, toast],
  );

  function onSearchKey(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor((value) => Math.min(value + 1, flat.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((value) => Math.max(value - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const command = flat[cursor];
      if (command) void fire(command);
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Fast actions"
      description="Everything the panel can do in one press. F7 closes it again."
      className="cheat-modal"
    >
      <div className="cheat">
        <input
          autoFocus
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            // A cursor left pointing at row nine of a list that now has two
            // is a cursor pointing at nothing.
            setCursor(0);
          }}
          onKeyDown={onSearchKey}
          className="input cheat-search"
          placeholder="Type to filter — ↑ ↓ to move, Enter to run"
          aria-label="Filter fast actions"
        />

        {result && (
          <p className={cn("cheat-result", !result.ok && "is-warm")}>{result.message}</p>
        )}

        <div className="cheat-list">
          {flat.length === 0 && <p className="chart-empty">Nothing matches that.</p>}

          {visible.map((section) => (
            <section key={section.group}>
              <h4>{section.group}</h4>
              {section.items.map((command) => {
                const index = flat.indexOf(command);
                const asking = confirming === command.id;
                return (
                  <button
                    key={command.id}
                    type="button"
                    className={cn(
                      "cheat-item",
                      index === cursor && "is-cursor",
                      asking && "is-asking",
                      command.confirm && "is-heavy",
                    )}
                    onMouseEnter={() => setCursor(index)}
                    onClick={() => void fire(command)}
                    disabled={pending !== null}
                  >
                    <span className="cheat-item-label">
                      <b>{command.label}</b>
                      {command.href ? (
                        <em>Go</em>
                      ) : command.confirm ? (
                        <em className="is-heavy">Heavy</em>
                      ) : (
                        <em>Run</em>
                      )}
                    </span>
                    <span className="cheat-item-hint">
                      {asking ? command.confirm : command.hint}
                    </span>
                    {asking && (
                      <span className="cheat-item-ask">
                        {pending === command.id ? "Working…" : "Press again to do it"}
                      </span>
                    )}
                  </button>
                );
              })}
            </section>
          ))}
        </div>

        <p className="note mt-0">
          Admin only, and re-checked on the server for every one of them. Nothing here is undone by
          closing the drawer.
        </p>
      </div>
    </Modal>
  );
}
