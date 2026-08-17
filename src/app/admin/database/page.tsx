import type { Metadata } from "next";
import Link from "next/link";

import { RankBars } from "@/components/admin/charts";
import { Reveal } from "@/components/app/motion";
import { Eyebrow, Panel, PanelHead, Tag } from "@/components/field";
import {
  BROWSABLE_TABLES,
  getTableRows,
  getTableSummaries,
  isBrowsableTable,
  type TableName,
} from "@/lib/admin/stats";
import { requireAdmin } from "@/lib/auth/guards";
import { stagger } from "@/lib/motion";

export const metadata: Metadata = { title: "Database · Admin" };
export const dynamic = "force-dynamic";

/**
 * The database, read-only.
 *
 * Row counts for every table, and the most recent rows of any one of them. The
 * table is chosen from a fixed list and read through Prisma's typed client —
 * there is no SQL box here, and there should never be one: a panel that can run
 * arbitrary statements turns one stolen admin session into a data breach.
 *
 * Column projections are chosen by hand for the same reason. Password hashes
 * and Stripe secrets are never selected, so they cannot leak through a screen
 * that only needed to prove a row exists.
 */
export default async function AdminDatabasePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const requested = typeof params.table === "string" ? params.table : undefined;
  const table: TableName = isBrowsableTable(requested) ? requested : "users";

  const [summaries, rows] = await Promise.all([getTableSummaries(), getTableRows(table)]);
  const total = summaries.reduce((sum, summary) => sum + summary.rows, 0);

  return (
    <>
      <Reveal as="header" className="page-head">
        <div>
          <Eyebrow>Storage</Eyebrow>
          <h1>Database.</h1>
          <p>
            Read-only. Counts for every table, and the newest rows of one — no hashes, no Stripe
            secrets, no way to run a statement of your own.
          </p>
        </div>
        <Tag tone="ghost">{`${total.toLocaleString("en-GB")} rows`}</Tag>
      </Reveal>

      <div className="chart-grid">
        <Reveal delay={stagger(0)}>
          <RankBars
            title="Rows per table"
            unitLabel="rows"
            rows={summaries.map((summary) => ({
              key: summary.name,
              label: summary.name,
              value: summary.rows,
            }))}
          />
        </Reveal>

        <Reveal delay={stagger(1)}>
          <Panel flush>
            <PanelHead title="Schema" aside={<Tag tone="ghost">{`${summaries.length} tables`}</Tag>} />
            <ul className="schema-list">
              {summaries.map((summary, index) => (
                <li key={summary.name} className="tick-in" style={{ animationDelay: `${index * 45}ms` }}>
                  <b>{summary.name}</b>
                  <span>{summary.description}</span>
                  <em>{summary.rows.toLocaleString("en-GB")}</em>
                </li>
              ))}
            </ul>
          </Panel>
        </Reveal>
      </div>

      <Reveal delay={stagger(2)} className="mt-5">
        <Panel flush>
          <PanelHead
            title={`${table} · newest ${rows.rows.length}`}
            aside={<Tag tone="ghost">Read-only</Tag>}
          />

          <nav className="table-picker" aria-label="Table">
            {BROWSABLE_TABLES.map((name) => (
              <Link
                key={name}
                href={`/admin/database?table=${name}`}
                aria-current={name === table ? "page" : undefined}
                scroll={false}
              >
                {name}
              </Link>
            ))}
          </nav>

          {rows.rows.length === 0 ? (
            <p className="chart-empty">This table is empty.</p>
          ) : (
            <div className="data-table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    {rows.columns.map((column) => (
                      <th key={column} scope="col">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.rows.map((row, index) => (
                    <tr key={index} className="tick-in" style={{ animationDelay: `${index * 22}ms` }}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </Reveal>
    </>
  );
}
