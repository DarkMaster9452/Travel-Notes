import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader, StatGrid, StatTile, Tag } from "@/components/sq/ui";
import {
  BROWSABLE_TABLES,
  getTableRows,
  getTableSummaries,
  isBrowsableTable,
  type TableName,
} from "@/lib/admin/stats";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Database · Admin" };
export const dynamic = "force-dynamic";

/**
 * Read-only, by construction.
 *
 * Counts for every table and the newest rows of one, read through the typed
 * client with every column chosen by hand. There is no raw SQL box and no way
 * to reach a table that is not on the list, because a panel that can run
 * arbitrary statements is a breach waiting for one stolen session. No hashes,
 * no Stripe secrets, no generation JSON.
 */
export default async function AdminDatabasePage({
  searchParams,
}: {
  searchParams: Promise<{ table?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const table: TableName = isBrowsableTable(params.table) ? params.table : "users";

  const [summaries, rows] = await Promise.all([getTableSummaries(), getTableRows(table)]);

  const total = summaries.reduce((sum, entry) => sum + entry.rows, 0);
  const biggest = [...summaries].sort((a, b) => b.rows - a.rows).slice(0, 4);

  return (
    <>
      <PageHeader
        kicker="Underneath"
        title="Database"
        lede="Read-only. Counts for every table, and the newest rows of one — no hashes, no Stripe secrets, no way to run a statement of your own."
        right={
          <Tag small>
            {total.toLocaleString("en-GB")} rows in {summaries.length} tables
          </Tag>
        }
      />

      <StatGrid>
        {biggest.map((entry, index) => (
          <StatTile
            key={entry.name}
            label={entry.name}
            count={entry.rows}
            countId={`db-${entry.name}`}
            note={entry.description}
            index={index}
          />
        ))}
      </StatGrid>

      <section className="sq-grid" style={{ marginTop: 16, gridTemplateColumns: "260px minmax(0,1fr)", gap: 16, alignItems: "start" }}>
        <article className="sq-card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "15px 20px", borderBottom: "1px solid var(--line-2)" }}>
            <h2 className="sq-h2" style={{ fontSize: 17 }}>
              Rows per table
            </h2>
          </div>
          <ul>
            {summaries.map((entry) => {
              const browsable = BROWSABLE_TABLES.includes(entry.name as TableName);
              const active = entry.name === table;
              return (
                <li key={entry.name}>
                  {browsable ? (
                    <Link
                      href={`/admin/database?table=${entry.name}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                        padding: "11px 20px",
                        borderTop: "1px solid var(--line-2)",
                        background: active ? "var(--paper-2)" : "transparent",
                        color: "var(--color-text)",
                        borderLeft: `2px solid ${active ? "var(--signal)" : "transparent"}`,
                      }}
                    >
                      <span className="sq-mono" style={{ fontSize: 11.5 }}>
                        {entry.name}
                      </span>
                      <b className="sq-mono" style={{ fontWeight: 500, fontSize: 11.5, color: "var(--ink-3)" }}>
                        {entry.rows.toLocaleString("en-GB")}
                      </b>
                    </Link>
                  ) : (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                        padding: "11px 20px",
                        borderTop: "1px solid var(--line-2)",
                        color: "var(--ink-3)",
                      }}
                    >
                      <span className="sq-mono" style={{ fontSize: 11.5 }}>
                        {entry.name}
                      </span>
                      <b className="sq-mono" style={{ fontWeight: 500, fontSize: 11.5 }}>
                        {entry.rows.toLocaleString("en-GB")}
                      </b>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </article>

        <article className="sq-card" style={{ overflow: "hidden" }}>
          <div className="sq-section-head sq-rule-head">
            <h2 className="sq-h2" style={{ fontSize: 19 }}>
              {table} · newest {rows.rows.length}
            </h2>
            <span className="sq-kicker-sm" style={{ fontSize: 10 }}>
              Read-only
            </span>
          </div>
          <div className="sq-scroll-x" style={{ margin: 0, padding: "0 0 8px" }}>
            <table className="sq-table" style={{ minWidth: 720 }}>
              <thead>
                <tr>
                  {rows.columns.map((column) => (
                    <th key={column} style={{ paddingTop: 12 }}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="sq-stagger">
                {rows.rows.map((row, index) => (
                  <tr key={index} style={{ ["--i" as string]: index }}>
                    {row.map((cell, column) => (
                      <td key={column} className="sq-table-num">
                        {String(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.rows.length === 0 ? (
            <p style={{ padding: "16px 22px", fontSize: 13, color: "var(--ink-3)" }}>
              That table is empty.
            </p>
          ) : null}
        </article>
      </section>
    </>
  );
}
