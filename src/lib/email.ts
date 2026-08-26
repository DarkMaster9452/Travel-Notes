import "server-only";

import { Resend } from "resend";

import { db } from "@/lib/db";
import { appUrl } from "@/lib/env";

/**
 * Transactional email.
 *
 * Four messages, and every one of them is the product telling somebody
 * something happened to *their* quest: a drop, a verdict, a reason, a sealed
 * board. There is no campaign machinery here and no template engine — four
 * messages do not need one, and a template engine is how a product ends up
 * sending five.
 *
 * Every send goes through `send`, which checks the account's notification
 * settings first. A member who turned verdicts off does not get one, and the
 * check lives here rather than at four call sites that would each eventually
 * forget it.
 *
 * With no API key configured the message is logged and reported as sent. A
 * deployment without email is a normal state — development, a preview branch —
 * and an approval that failed because the mailer was not set up would be the
 * wrong thing to break.
 */

export type NotificationKind = "questDrop" | "verdict" | "boardSealed" | "productNews";

let client: Resend | null = null;

function mailer(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  client ??= new Resend(key);
  return client;
}

export function emailEnabled(): boolean {
  return (process.env.RESEND_API_KEY ?? "").length > 0;
}

/** Defaults match the schema's: everything on except product news. */
const DEFAULTS: Record<NotificationKind, boolean> = {
  questDrop: true,
  verdict: true,
  boardSealed: true,
  productNews: false,
};

async function wants(userId: string, kind: NotificationKind): Promise<boolean> {
  const settings = await db.notificationSettings.findUnique({
    where: { userId },
    select: { questDrop: true, verdict: true, boardSealed: true, productNews: true },
  });
  if (!settings) return DEFAULTS[kind];
  return settings[kind];
}

type Message = { subject: string; body: string[]; action?: { label: string; href: string } };

/**
 * One message, to one person, if they asked for that kind.
 *
 * Returns quietly rather than throwing: the caller is always in the middle of
 * something that already succeeded, and a mail server having a bad afternoon
 * must not roll back a verdict.
 */
export async function send(
  userId: string,
  kind: NotificationKind,
  message: Message,
): Promise<{ sent: boolean; reason?: string }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });
  if (!user) return { sent: false, reason: "no account" };

  if (!(await wants(userId, kind))) return { sent: false, reason: "turned off" };

  const from = process.env.EMAIL_FROM || "Summit Quest <quests@summitquest.app>";
  const html = render(user.name, message);

  const resend = mailer();
  if (!resend) {
    console.info(`[email:${kind}] → ${user.email}: ${message.subject}`);
    return { sent: true, reason: "logged — no RESEND_API_KEY" };
  }

  try {
    await resend.emails.send({
      from,
      to: user.email,
      subject: message.subject,
      html,
      text: [`Hello ${user.name.split(" ")[0]},`, ...message.body, message.action ? `${message.action.label}: ${absolute(message.action.href)}` : ""]
        .filter(Boolean)
        .join("\n\n"),
    });
    return { sent: true };
  } catch (error) {
    console.error(`[email:${kind}] failed`, error);
    return { sent: false, reason: "send failed" };
  }
}

function absolute(href: string): string {
  return href.startsWith("http") ? href : `${appUrl}${href}`;
}

/**
 * The one template.
 *
 * Paper ground, pine ink, a serif heading — the same three decisions the rest
 * of the product makes, written as inline styles because that is the only
 * styling an email client can be relied on to keep.
 */
function render(name: string, message: Message): string {
  const paragraphs = message.body
    .map(
      (line) =>
        `<p style="margin:0 0 14px;font:15px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:#47544b">${escape(line)}</p>`,
    )
    .join("");

  const button = message.action
    ? `<a href="${escape(absolute(message.action.href))}" style="display:inline-block;margin-top:8px;padding:11px 18px;border-radius:8px;background:#2c5540;color:#f9faf3;font:600 14px/1 -apple-system,Segoe UI,Roboto,sans-serif;text-decoration:none">${escape(message.action.label)}</a>`
    : "";

  return `<!doctype html><html><body style="margin:0;background:#eff0e5;padding:32px 16px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#f9faf3;border:1px solid rgba(20,26,22,0.08);border-radius:14px">
      <tr><td style="padding:28px 30px">
        <p style="margin:0 0 18px;font:11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:0.12em;text-transform:uppercase;color:#848a78">Summit Quest</p>
        <h1 style="margin:0 0 18px;font:600 25px/1.15 Georgia,'Iowan Old Style',serif;color:#141a16;letter-spacing:-0.02em">${escape(message.subject)}</h1>
        <p style="margin:0 0 14px;font:15px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:#47544b">Hello ${escape(name.split(" ")[0] || name)},</p>
        ${paragraphs}
        ${button}
      </td></tr>
      <tr><td style="padding:16px 30px;border-top:1px solid rgba(20,26,22,0.08);background:#e3e8d7;border-radius:0 0 14px 14px">
        <p style="margin:0;font:12px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#6c7365">You can turn these off in <a href="${escape(`${appUrl}/settings/notifications`)}" style="color:#21402f">Settings → Notifications</a>.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* -------------------------------------------------------------------------- */
/* The four messages                                                           */
/* -------------------------------------------------------------------------- */

export async function sendQuestDrop(
  userId: string,
  quest: { title: string; where: string; period: "WEEKLY" | "MONTHLY"; label: string; questId: string },
) {
  const noun = quest.period === "MONTHLY" ? "monthly" : "weekly";
  return send(userId, "questDrop", {
    subject: `The ${noun} is open: ${quest.title}`,
    body: [
      `${quest.label} has opened, and the ${noun} quest is ${quest.title} — ${quest.where}.`,
      "Nothing counts until somebody has read your proof, so file it while the window is open.",
    ],
    action: { label: "Open the quest", href: `/quests/${quest.questId}` },
  });
}

export async function sendVerdict(
  userId: string,
  verdict: { approved: boolean; questTitle: string; note?: string | null; points?: number },
) {
  if (verdict.approved) {
    return send(userId, "verdict", {
      subject: `Approved: ${verdict.questTitle}`,
      body: [
        "Somebody read your proof and it stands. The quest counts, and the points are on the board.",
        verdict.points ? `It was worth ${verdict.points} points.` : "",
      ].filter(Boolean),
      action: { label: "See the board", href: "/leaderboard" },
    });
  }

  return send(userId, "verdict", {
    subject: `Sent back: ${verdict.questTitle}`,
    body: [
      "A reader has sent your proof back. It keeps its photographs and its note, and you can add to it and file again inside the same window.",
      verdict.note ? `In their words: “${verdict.note}”` : "No reason was left, which is a mistake on our side — reply and we will chase it.",
    ],
    action: { label: "Open your submissions", href: "/submissions" },
  });
}

export async function sendBoardSealed(
  userId: string,
  board: { label: string; rank: number; medal: string; score: number },
) {
  return send(userId, "boardSealed", {
    subject: `${board.label} is sealed — you finished ${ordinal(board.rank)}`,
    body: [
      `The board for ${board.label} has closed with ${board.score} points against your name, and ${ordinal(board.rank)} place is now fixed for good.`,
      "A verdict changed three weeks from now moves the points, never the medal. Your sticker goes out with the next envelope.",
    ],
    action: { label: "See the sealed board", href: "/leaderboard" },
  });
}

/**
 * The envelope, one way or the other.
 *
 * Two messages rather than one, because they are two different pieces of news
 * and a single hedged sentence would serve neither: one says a parcel is in
 * the post, the other says it is not and here is the card instead.
 *
 * Filed under `questDrop` rather than under a fifth switch. This is the
 * monthly card arriving — the same thing that switch already governs — and an
 * account that has turned off "a quest has opened" has said it does not want
 * to hear about the month's card by mail.
 */
export async function sendEnvelopePosted(
  userId: string,
  envelope: { month: string; stickers: number },
) {
  return send(userId, "questDrop", {
    subject: `Your ${envelope.month} envelope is in the post`,
    body: [
      `The ${envelope.month} quest card${envelope.stickers > 0 ? ` and ${envelope.stickers === 1 ? "a sticker" : `${envelope.stickers} stickers`}` : ""} went out today, to the address on your account.`,
      "If it has not arrived within a fortnight, reply to this and we will send another.",
    ],
    action: { label: "Check the address", href: "/settings/address" },
  });
}

/**
 * No address, so no envelope.
 *
 * Said plainly, with the remedy attached. The point of this message is that
 * nobody silently loses something their plan includes: they get the card, it
 * simply arrives on a screen instead of on paper, and the one thing standing
 * between them and the paper version is named.
 */
export async function sendEnvelopeByEmail(
  userId: string,
  envelope: { month: string; stickers: number },
) {
  return send(userId, "questDrop", {
    subject: `Your ${envelope.month} quest card — by email this time`,
    body: [
      `Your plan includes the printed envelope, but we have no postal address for you, so the ${envelope.month} card is here rather than in a jiffy bag.`,
      envelope.stickers > 0
        ? `${envelope.stickers === 1 ? "One sticker is" : `${envelope.stickers} stickers are`} waiting to be printed and will go out with the first envelope we can actually post.`
        : "Your stickers will go out with the first envelope we can actually post.",
      "Add an address and the next one goes in the post.",
    ],
    action: { label: "Add an address", href: "/settings/address" },
  });
}

function ordinal(rank: number): string {
  if (rank === 1) return "first";
  if (rank === 2) return "second";
  if (rank === 3) return "third";
  return `${rank}th`;
}

/**
 * An invitation to the desk.
 *
 * Not gated on notification settings, and deliberately so: the recipient has
 * no account with settings yet, and this is not a notification about their
 * quests — it is the credential half of an invitation somebody at the desk
 * just wrote. It is sent directly rather than through `send` for that reason.
 */
export async function sendStaffInvite(
  email: string,
  invite: { role: string; link: string; invitedBy: string; expiresAt: Date },
): Promise<{ sent: boolean; reason?: string }> {
  const from = process.env.EMAIL_FROM || "Summit Quest <quests@summitquest.app>";
  const when = invite.expiresAt.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  });

  const message: Message = {
    subject: `${invite.invitedBy} has asked you to join the Summit Quest desk`,
    body: [
      `You have been invited as a ${invite.role.toLowerCase()}.`,
      "Sign in with this address first, then open the link below — it only works for the account it was written to.",
      `The invitation expires on ${when}.`,
    ],
    action: { label: "Accept the invitation", href: invite.link },
  };

  const resend = mailer();
  if (!resend) {
    console.info(`[email:invite] → ${email}: ${invite.link}`);
    return { sent: true, reason: "logged — no RESEND_API_KEY" };
  }

  try {
    await resend.emails.send({
      from,
      to: email,
      subject: message.subject,
      html: render(email.split("@")[0], message),
      text: [...message.body, invite.link].join("\n\n"),
    });
    return { sent: true };
  } catch (error) {
    console.error("[email:invite] failed", error);
    return { sent: false, reason: "send failed" };
  }
}
