"use client";

import * as React from "react";

import { SubmissionDetail, type SubmissionRow } from "@/components/admin/submission-detail";
import { Avatar, Tag } from "@/components/field";
import { formatRelativeDate } from "@/lib/utils";

const STATUS_TONE = { PENDING: "ghost", APPROVED: "pine", REJECTED: "warm" } as const;
const STATUS_LABEL = { PENDING: "Pending", APPROVED: "Approved", REJECTED: "Declined" } as const;

/**
 * The record of everything filed, with each row opening the thing itself.
 *
 * The table used to be read-only on purpose — a row invites approving without
 * reading, which is exactly what a review queue must not make easy. That
 * still holds: the row opens the *evidence*, and the verdict lives behind it
 * next to the photographs and the figures, not on the row.
 */
export function SubmissionsTable({ rows }: { rows: SubmissionRow[] }) {
  const [openId, setOpenId] = React.useState<string | null>(null);
  const open = rows.find((row) => row.id === openId) ?? null;

  if (rows.length === 0) {
    return <p className="chart-empty">Nothing filed under that filter.</p>;
  }

  return (
    <>
      <ul>
        {rows.map((row) => (
          <li key={row.id} className="border-b border-line last:border-b-0">
            <button type="button" className="admin-row sub-row" onClick={() => setOpenId(row.id)}>
              <Avatar
                name={row.author.name}
                className="size-9 flex-[0_0_2.25rem] rounded-[11px] text-[12px]"
              />
              <span className="min-w-[min(100%,15rem)] flex-1 text-left">
                <b className="block text-[15px] font-semibold">{row.quest.title}</b>
                <span className="meta normal-case tracking-[0.06em]">
                  {row.author.name} · {row.quest.location}
                </span>
              </span>
              <span className="meta w-24 shrink-0">
                {row.photos.length} photo{row.photos.length === 1 ? "" : "s"}
              </span>
              <span className="meta hidden w-28 shrink-0 md:inline">
                {formatRelativeDate(row.createdAt)}
              </span>
              <span className="meta hidden w-32 shrink-0 lg:inline">
                {row.reviewedBy ? `by ${row.reviewedBy}` : "—"}
              </span>
              <Tag tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Tag>
            </button>
          </li>
        ))}
      </ul>

      <SubmissionDetail submission={open} onClose={() => setOpenId(null)} />
    </>
  );
}
