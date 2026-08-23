import type { Metadata } from "next";
import Link from "next/link";

import { Reveal } from "@/components/app/motion";
import { Eyebrow, IconShield, Panel, PanelHead } from "@/components/field";
import { requireClient } from "@/lib/auth/guards";
import { stagger } from "@/lib/motion";
import { RULES } from "@/lib/rules";

export const metadata: Metadata = { title: "The rules" };

/**
 * How the thing works, written out.
 *
 * Not the terms — `/legal/terms` is the contract and this is the game. Every
 * word comes from `lib/rules`, so the short version in Settings and the long
 * version here can never disagree.
 */
export default async function RulesPage() {
  await requireClient();

  return (
    <>
      <Reveal as="header" className="page-head">
        <div>
          <Eyebrow>How this works</Eyebrow>
          <h1>The rules.</h1>
          <p>
            Short, and there are not many. Everything here is what the product actually does — if a
            line reads as a surprise, it is the line that is wrong.
          </p>
        </div>
      </Reveal>

      <nav className="rules-jump" aria-label="Jump to a section">
        {RULES.map((group) => (
          <a key={group.id} href={`#${group.id}`}>
            {group.heading}
          </a>
        ))}
      </nav>

      <div className="flex flex-col gap-5">
        {RULES.map((group, index) => (
          <Reveal key={group.id} delay={stagger(index, 8)}>
            <Panel flush id={group.id} className="scroll-mt-24">
              <PanelHead title={group.heading} />
              <div className="px-5 py-5">
                <p className="rules-intro">{group.intro}</p>
                <ol className="rules-list">
                  {group.rules.map((rule, ruleIndex) => (
                    <li key={rule.title}>
                      <span className="rules-n" aria-hidden="true">
                        {String(ruleIndex + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <b>{rule.title}</b>
                        <p>{rule.body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </Panel>
          </Reveal>
        ))}
      </div>

      <Reveal delay={stagger(RULES.length, 8)}>
        <div className="safety mt-5">
          <IconShield />
          <p>
            The full safety notice is at{" "}
            <Link href="/legal/safety" className="underline">
              /legal/safety
            </Link>
            , and the contract you actually signed is at{" "}
            <Link href="/legal/terms" className="underline">
              /legal/terms
            </Link>
            . Where they and this page differ, the terms win — tell us, because it means we have
            written something here badly.
          </p>
        </div>
      </Reveal>
    </>
  );
}
