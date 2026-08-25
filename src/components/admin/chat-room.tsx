"use client";

import * as React from "react";

import {
  deleteMessageAction,
  editMessageAction,
  markChatReadAction,
  pollMessagesAction,
  postMessageAction,
} from "@/app/admin/chat/actions";
import { Avatar, useToast } from "@/components/field";
import type { ChatMessage } from "@/lib/admin/chat";
import { cn } from "@/lib/utils";

/**
 * The room.
 *
 * Polled, not pushed. There are a handful of admins and a message every few
 * minutes; a socket for that is a connection to keep alive, a reconnect path
 * to get wrong and a deployment concern, in exchange for latency nobody in
 * this room is waiting on. Every eight seconds it asks what has arrived since
 * the last id it holds, which is usually one indexed read returning nothing.
 *
 * Polling stops while the tab is hidden and resumes — with an immediate catch-
 * up — when it comes back. A background tab left open overnight should not
 * spend the night querying, and should not come back showing yesterday.
 *
 * A sent message appears immediately under a provisional id and is replaced by
 * the real row on the next poll. If the send fails the draft comes back in the
 * box rather than vanishing with the text in it.
 */

const POLL_MS = 8000;
/** Two messages from the same person inside this window are one block. */
const GROUP_MS = 5 * 60 * 1000;

export function ChatRoom({
  initial,
  meId,
  meName,
}: {
  initial: ChatMessage[];
  meId: string;
  meName: string;
}) {
  const toast = useToast();
  const [messages, setMessages] = React.useState(initial);
  const [draft, setDraft] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [editing, setEditing] = React.useState<string | null>(null);
  const [editDraft, setEditDraft] = React.useState("");

  const streamRef = React.useRef<HTMLDivElement>(null);
  const atBottomRef = React.useRef(true);

  /** The newest *real* id — a provisional one is no use to the poller. */
  const lastRealId = React.useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const id = messages[index]!.id;
      if (!id.startsWith("pending:")) return id;
    }
    return null;
  }, [messages]);

  const merge = React.useCallback((incoming: ChatMessage[]) => {
    if (incoming.length === 0) return;
    setMessages((current) => {
      const known = new Set(current.map((message) => message.id));
      const fresh = incoming.filter((message) => !known.has(message.id));
      if (fresh.length === 0) return current;
      // Anything provisional is dropped: the real rows have arrived, and
      // keeping both would show the sender their own message twice.
      const settled = current.filter((message) => !message.id.startsWith("pending:"));
      return [...settled, ...fresh];
    });
  }, []);

  // The poll. Re-armed after each round rather than on an interval, so a slow
  // response cannot stack requests on top of each other.
  React.useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function tick() {
      if (document.visibilityState === "visible") {
        const fresh = await pollMessagesAction(lastRealId).catch(() => null);
        if (cancelled) return;
        if (fresh) merge(fresh);
      }
      if (!cancelled) timer = setTimeout(tick, POLL_MS);
    }

    timer = setTimeout(tick, POLL_MS);

    function onVisible() {
      if (document.visibilityState !== "visible") return;
      // Catch up at once rather than waiting out the rest of the interval.
      void pollMessagesAction(lastRealId)
        .then((fresh) => {
          if (!cancelled) merge(fresh);
        })
        .catch(() => undefined);
      void markChatReadAction().catch(() => undefined);
    }

    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [lastRealId, merge]);

  // Reading the room is what marks it read — once, on arrival.
  React.useEffect(() => {
    void markChatReadAction().catch(() => undefined);
  }, []);

  // Follow the conversation, but only for somebody already at the bottom of
  // it. Yanking the view away from a person reading back through last week is
  // the thing every chat gets wrong once.
  React.useEffect(() => {
    const stream = streamRef.current;
    if (!stream || !atBottomRef.current) return;
    stream.scrollTop = stream.scrollHeight;
  }, [messages]);

  function onScroll() {
    const stream = streamRef.current;
    if (!stream) return;
    const distance = stream.scrollHeight - stream.scrollTop - stream.clientHeight;
    atBottomRef.current = distance < 80;
  }

  async function send(formData: FormData) {
    const body = String(formData.get("body") ?? "").trim();
    if (!body || sending) return;

    setSending(true);
    setDraft("");
    atBottomRef.current = true;

    const provisional: ChatMessage = {
      id: `pending:${Date.now()}`,
      body,
      createdAt: new Date().toISOString(),
      editedAt: null,
      author: { id: meId, name: meName },
      mine: true,
    };
    setMessages((current) => [...current, provisional]);

    const result = await postMessageAction(formData).catch(() => null);
    setSending(false);

    if (!result?.ok) {
      // Put the words back where they were typed.
      setMessages((current) => current.filter((message) => message.id !== provisional.id));
      setDraft(body);
      toast({
        title: "Not sent.",
        detail: result?.message ?? "Try again in a moment.",
        tone: "warm",
      });
      return;
    }

    const fresh = await pollMessagesAction(lastRealId).catch(() => null);
    if (fresh) merge(fresh);
  }

  async function saveEdit(id: string) {
    const body = editDraft.trim();
    if (!body) return;

    const result = await editMessageAction(id, body).catch(() => null);
    if (!result?.ok) {
      toast({ title: "Not saved.", detail: result?.message, tone: "warm" });
      return;
    }
    setMessages((current) =>
      current.map((message) =>
        message.id === id ? { ...message, body, editedAt: new Date().toISOString() } : message,
      ),
    );
    setEditing(null);
  }

  async function remove(id: string) {
    const previous = messages;
    setMessages((current) => current.filter((message) => message.id !== id));

    const result = await deleteMessageAction(id).catch(() => null);
    if (!result?.ok) {
      setMessages(previous);
      toast({ title: "Not deleted.", detail: result?.message, tone: "warm" });
    }
  }

  return (
    <div className="chat-room">
      <div className="chat-stream" ref={streamRef} onScroll={onScroll}>
        {messages.length === 0 ? (
          <p className="chart-empty">
            Nothing said yet. This room is only visible to admins, and everything in it stays.
          </p>
        ) : (
          messages.map((message, index) => {
            const previous = messages[index - 1];
            const grouped =
              previous !== undefined &&
              previous.author?.id === message.author?.id &&
              new Date(message.createdAt).getTime() - new Date(previous.createdAt).getTime() <
                GROUP_MS;

            return (
              <article
                key={message.id}
                className={cn(
                  "chat-message",
                  message.mine && "is-mine",
                  grouped && "is-grouped",
                  message.id.startsWith("pending:") && "is-pending",
                )}
              >
                {grouped ? (
                  <span className="chat-gutter" aria-hidden="true" />
                ) : (
                  <Avatar name={message.author?.name ?? "?"} className="chat-av" />
                )}

                <div className="chat-body">
                  {!grouped && (
                    <header>
                      <b>{message.author?.name ?? "Deleted account"}</b>
                      <time dateTime={message.createdAt}>{clock(message.createdAt)}</time>
                      {message.editedAt && <em>edited</em>}
                    </header>
                  )}

                  {editing === message.id ? (
                    <div className="chat-edit">
                      <textarea
                        className="input"
                        rows={2}
                        value={editDraft}
                        onChange={(event) => setEditDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Escape") setEditing(null);
                          if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            void saveEdit(message.id);
                          }
                        }}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => void saveEdit(message.id)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setEditing(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p>{message.body}</p>
                  )}

                  {message.mine && editing !== message.id && !message.id.startsWith("pending:") && (
                    <div className="chat-actions">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(message.id);
                          setEditDraft(message.body);
                        }}
                      >
                        Edit
                      </button>
                      <button type="button" onClick={() => void remove(message.id)}>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      <form action={send} className="chat-compose">
        <textarea
          name="body"
          className="input"
          rows={2}
          maxLength={2000}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            // Enter sends, Shift+Enter breaks the line — the convention every
            // other chat has taught everybody who will use this.
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder="Say something to the other admins…"
          aria-label="Message"
        />
        <button type="submit" className="btn btn-primary" disabled={sending || !draft.trim()}>
          {sending ? "Sending…" : "Send"}
        </button>
      </form>
    </div>
  );
}

/** "14:32", or "Mon 14:32" once it is not today. */
function clock(iso: string): string {
  const when = new Date(iso);
  const today = new Date().toDateString() === when.toDateString();
  return new Intl.DateTimeFormat("en-GB", {
    ...(today ? {} : { weekday: "short", day: "numeric", month: "short" }),
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(when);
}
