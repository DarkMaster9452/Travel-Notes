"use client";

import { animate, stagger, utils } from "animejs";
import * as React from "react";

import { IconBell } from "@/components/field";
import { unstyle, usePrefersReducedMotion } from "@/components/motion/anime";
import type { AdminNotice } from "@/lib/admin/notifications";
import { EASE_FIELD } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { NoticeList, urgentCount } from "./notices";

/**
 * The bell in the panel chrome.
 *
 * The notices themselves are computed on the server on every request, so this
 * component holds exactly one piece of client state that the server cannot:
 * which of them this admin has already looked at.
 *
 * That is kept in `localStorage` rather than the database on purpose. "Seen"
 * is a property of a person at a screen, not of the account — it does not need
 * to survive to another device, it must never block a page render on a write,
 * and a schema migration to store it would make an audit trail out of
 * something with the lifespan of a glance. The list underneath is always the
 * live truth; the badge is only about whether it has changed since you last
 * looked.
 */
const SEEN_KEY = "sq.admin.notices.seen";

/**
 * The seen list, as an external store.
 *
 * `useSyncExternalStore` rather than an effect that reads storage on mount:
 * this is exactly the shape it exists for — a value React does not own, with a
 * server snapshot that is honestly "nothing known yet". It also means a second
 * tab that clears the bell updates this one, through the `storage` event.
 *
 * The snapshot is the raw string, deliberately. It has to be referentially
 * stable between calls or the store re-renders forever, and a parsed array
 * never is.
 */
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function snapshot(): string {
  try {
    return window.localStorage.getItem(SEEN_KEY) ?? "";
  } catch {
    // A private window, cleared site data, storage disabled outright: every
    // notice simply reads as unseen, which is the safe direction to fail.
    return "";
  }
}

/** The server has no storage, so nothing has been seen there. */
const serverSnapshot = () => "";

function parseSeen(raw: string): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writeSeen(ids: string[]) {
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(ids));
  } catch {
    // Nothing to do and nothing worth telling anyone about — the panel works
    // exactly as well with the badge always lit.
  }
  // `storage` only fires in *other* tabs, so this one is told directly.
  listeners.forEach((listener) => listener());
}

export function NotificationCenter({ notices }: { notices: AdminNotice[] }) {
  const [open, setOpen] = React.useState(false);
  const reduced = usePrefersReducedMotion();
  const root = React.useRef<HTMLDivElement>(null);
  const panel = React.useRef<HTMLDivElement>(null);
  const bell = React.useRef<HTMLButtonElement>(null);

  const raw = React.useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const badge = React.useMemo(() => {
    const known = new Set(parseSeen(raw));
    return notices.filter((notice) => !known.has(notice.id)).length;
  }, [notices, raw]);

  const loud = urgentCount(notices);

  // Opening the panel is what marks them read. Only the notices actually on
  // screen are marked, so one that arrives while the panel is open still
  // lights the bell afterwards.
  const markSeen = React.useCallback(() => {
    writeSeen(notices.map((notice) => notice.id));
  }, [notices]);

  React.useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        bell.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // The panel drops out of the bell and deals its rows, so a list of things
  // that are wrong doesn't arrive all at once as a wall.
  React.useEffect(() => {
    const node = panel.current;
    if (!open || reduced || !node) return;

    const rows = Array.from(node.querySelectorAll<HTMLElement>(".notice, .notice-empty"));

    const opening = animate(node, {
      opacity: [0, 1],
      translateY: [-8, 0],
      scale: [0.97, 1],
      duration: 220,
      ease: EASE_FIELD,
      onComplete: () => unstyle(node),
    });

    let dealing: ReturnType<typeof animate> | undefined;
    if (rows.length > 0) {
      utils.set(rows, { opacity: 0, translateY: 8 });
      dealing = animate(rows, {
        opacity: [0, 1],
        translateY: [8, 0],
        duration: 320,
        delay: stagger(45, { start: 80 }),
        ease: EASE_FIELD,
        onComplete: () => unstyle(rows),
      });
    }

    return () => {
      opening.pause();
      dealing?.pause();
      unstyle(node);
      unstyle(rows);
    };
  }, [open, reduced]);

  return (
    <div className="notice-center" ref={root}>
      <button
        ref={bell}
        type="button"
        className={cn("notice-bell press", loud > 0 && "is-loud")}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={
          notices.length === 0
            ? "Notifications — nothing needs attention"
            : `Notifications — ${notices.length} needing attention`
        }
        onClick={() => {
          // Computed outside the updater: a state updater has to stay pure, and
          // marking these read is a write to storage.
          const next = !open;
          setOpen(next);
          if (next) markSeen();
        }}
      >
        <IconBell />
        {badge > 0 && (
          <span className="notice-bell-count" aria-hidden="true">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panel}
          role="dialog"
          aria-label="Notifications"
          className="notice-panel"
        >
          <div className="notice-panel-head">
            <span className="qc-id">Needs attention</span>
            <span className="meta">
              {notices.length === 0 ? "All clear" : `${notices.length} open`}
            </span>
          </div>
          <div className="notice-panel-body">
            <NoticeList notices={notices} />
          </div>
        </div>
      )}
    </div>
  );
}
