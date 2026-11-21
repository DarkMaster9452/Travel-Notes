/**
 * The design system's rules, checked (design/DESIGN-SYSTEM.md §11).
 *
 *   npm run lint:design
 *
 * Scans the customer side — the landing page, auth, legal, the app and the
 * shared Trail components — and fails on anything the system forbids in a
 * component: raw colours, gradients, arbitrary values, Tailwind's default
 * palette, default radii, the legacy classes and imports, and inline styles
 * that set a colour or a size.
 *
 * Domain maps that are allowed to name the raw palette (§1.1: difficulty,
 * trail marks, medals, profile colours, charts, sticker inks) are listed in
 * RAW_PALETTE_OK; inline styles are allowed only to pass a CSS variable.
 *
 * The admin panel (`src/app/admin`, `src/components/sq`) is the last legacy
 * layer and is not scanned until it is rebuilt.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");

const SCAN = [
  "src/app/page.tsx",
  "src/app/layout.tsx",
  "src/app/not-found.tsx",
  "src/app/(app)",
  "src/app/(auth)",
  "src/app/legal",
  "src/app/invite",
  "src/components/app",
  "src/components/domain",
  "src/components/marketing",
  "src/components/ui",
];

/** Files that may name the raw palette because they are domain maps (§1.1). */
const RAW_PALETTE_OK = new Set([
  "src/components/domain/sticker.tsx",
  "src/components/domain/medal.tsx",
  "src/components/domain/activity-grid.tsx",
  "src/components/ui/logo.tsx",
]);

/**
 * The browser's own chrome colour (`viewport.themeColor`) cannot read a CSS
 * variable, so the root layout writes the two page grounds out by hand.
 */
const HEX_OK = new Set(["src/app/layout.tsx"]);

/** `global-error.tsx` replaces the root layout and has no stylesheet: inline values are its only option. */
const SKIP = new Set(["src/app/global-error.tsx"]);

type Rule = { name: string; test: RegExp; allowIn?: Set<string> };

const TW_DEFAULT_COLOURS =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const UTILITY = "(?:bg|text|border|ring|outline|fill|stroke|from|to|via|shadow|divide|decoration|accent|caret)";

const RULES: Rule[] = [
  { name: "hex colour", test: /#[0-9a-fA-F]{3,8}\b(?![\w-])/, allowIn: HEX_OK },
  { name: "rgb()/hsl() colour", test: /\b(?:rgba?|hsla?)\(/ },
  { name: "gradient", test: /gradient/i },
  {
    name: "Tailwind default colour",
    test: new RegExp(`\\b${UTILITY}-(?:${TW_DEFAULT_COLOURS})-\\d{2,3}\\b`),
  },
  {
    name: "raw palette in a component",
    test: new RegExp(`\\b${UTILITY}-(?:moss|meadow|sunset)-\\d{1,3}\\b`),
    allowIn: RAW_PALETTE_OK,
  },
  {
    name: "default radius",
    test: /\brounded(?:-[tblr]{1,2})?-(?:sm|md|lg|xl|2xl|3xl|full)\b/,
  },
  // `[`...`]` utilities: arbitrary values. `grid-rows-subgrid` and the
  // container-query sizes (`@3xl:`) are named, not arbitrary.
  { name: "arbitrary value", test: /\b[a-z][\w:-]*-\[[^\]]+\]/ },
  { name: "legacy class", test: /className=["{`][^"}`]*\b(?:sq|lg)-[a-z]/ },
  { name: "legacy import", test: /from "@\/components\/(?:sq|field|landing|auth|motion)\// },
  // Inline styles may only hand a component a CSS variable (`["--x" as string]`).
  {
    name: "inline style that is not a CSS variable",
    test: /style=\{\{\s*(?!\[?["'`]?--)[a-zA-Z]/,
  },
];

function files(entry: string): string[] {
  const full = path.join(ROOT, entry);
  if (!fs.existsSync(full)) return [];
  if (fs.statSync(full).isFile()) return [entry];
  return fs.readdirSync(full).flatMap((name) => files(path.join(entry, name)));
}

const problems: string[] = [];
let scanned = 0;

for (const file of SCAN.flatMap(files)) {
  if (!/\.(tsx|ts)$/.test(file) || SKIP.has(file)) continue;
  scanned += 1;
  const lines = fs.readFileSync(path.join(ROOT, file), "utf8").split("\n");
  let inBlockComment = false;

  lines.forEach((raw, index) => {
    // Comments describe rules; they do not break them.
    let line = raw;
    if (inBlockComment) {
      const end = line.indexOf("*/");
      if (end === -1) return;
      line = line.slice(end + 2);
      inBlockComment = false;
    }
    line = line.replace(/\/\*.*?\*\//g, "");
    const start = line.indexOf("/*");
    if (start !== -1) {
      inBlockComment = true;
      line = line.slice(0, start);
    }
    line = line.replace(/(^|\s)\/\/.*$/, "$1");
    if (!line.trim()) return;

    for (const rule of RULES) {
      if (rule.allowIn?.has(file)) continue;
      if (rule.test.test(line)) {
        problems.push(`${file}:${index + 1}  ${rule.name}\n    ${raw.trim().slice(0, 140)}`);
      }
    }
  });
}

if (problems.length > 0) {
  console.error(problems.join("\n"));
  console.error(`\n✗ ${problems.length} design-system violation(s) in ${scanned} files.`);
  process.exit(1);
}
console.log(`✓ ${scanned} files follow the design system.`);
