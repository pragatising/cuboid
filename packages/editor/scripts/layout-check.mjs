#!/usr/bin/env node
// Measures the editor's layout in real Chrome and fails if it is not what the portfolio's is. jsdom has no layout and does not resolve the cascade, so the
// unit tests can only read the stylesheet; this reads what is drawn.
//
//   npm run dev -w @sragatiping/cuboid-editor     # in one terminal (or EDITOR_URL=… for a running one)
//   npm run check:layout -w @sragatiping/cuboid-editor [-- --shots <dir>]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { open } from "./browser.mjs";

const URL = process.env.EDITOR_URL ?? "http://localhost:5189/";
const shots = process.argv.includes("--shots") ? path.resolve(process.argv[process.argv.indexOf("--shots") + 1] ?? ".layout-check") : null;
// The spacing is Cuboid's `prose` tokens (light mode, built to dist/tokens.json), so the check follows them instead of repeating their numbers.
const { sizes: PROSE } = JSON.parse(fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../primitives/dist/tokens.json"), "utf8")).prose;
const px = (rem) => parseFloat(rem) * 16;
const STEP = px(PROSE.blockGap); // the rows are one step apart
const INSET = px(PROSE.inset); // a text block's own inset, all round
const HEADING_INSET = Object.fromEntries(Object.entries(PROSE.headingInset).map(([level, rem]) => [level.toUpperCase(), px(rem)])); // added to the step above a heading
const COLUMN_GAP = 32;

const browser = await open({ width: 1500, height: 1200, scale: shots ? 2 : 1 });
const failures = [];
const expect = (ok, message) => ok || failures.push(message);
try {
  await browser.goto(URL);
  const measure = (rootSelector) =>
    browser.eval(`(() => {
      const root = document.querySelector(${JSON.stringify(rootSelector)});
      if (!root) return null;
      return [...root.children].map((el) => {
        const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
        const col = el.matches('[data-component="Columns"]') ? el : el.querySelector('[data-component="Columns"], .columns, [data-columns]');
        return { tag: el.tagName, text: (el.textContent || '').trim().slice(0, 24), top: r.top, bottom: r.bottom, pad: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(parseFloat), font: parseFloat(cs.fontSize), line: parseFloat(cs.lineHeight) };
      });
    })()`);
  const write = await measure('[aria-label="Write"] .ProseMirror');
  const read = await measure('[aria-label="Read"] [data-component="Read"]');
  expect(write && read, `could not find the Write and Read surfaces at ${URL}`);
  if (write && read) {
    expect(write.length === read.length, `Write has ${write.length} blocks and Read ${read.length}`);
    const gaps = (rows) => rows.map((r, i) => (i ? r.top - rows[i - 1].bottom : 0));
    write.forEach((block, i) => {
      const what = `${block.tag.toLowerCase()} "${block.text}"`;
      if (/^(P|H[1-6])$/.test(block.tag)) {
        expect(block.pad.every((p) => p === INSET), `${what}: inset is ${block.pad.join("/")}, not ${INSET} all round`);
        if (block.tag[0] === "H") expect(Math.abs(block.line - block.font * 1.2) < 0.5, `${what}: line height ${block.line}px is not 1.2 x ${block.font}px`);
      }
      if (i) {
        // A block that is not a text row has the text row's inset as margin, before it and after it, so any two blocks are an inset, a step and an inset apart.
        const box = (row) => !/^(P|H[1-6])$/.test(row.tag);
        const want = STEP + (HEADING_INSET[block.tag] ?? 0) + (box(block) ? INSET : 0) + (box(write[i - 1]) ? INSET : 0);
        const got = gaps(write)[i];
        expect(Math.abs(got - want) < 0.5, `${what}: ${got.toFixed(1)}px above, not ${want}px`);
      }
    });
    const [gw, gr] = [gaps(write), gaps(read)];
    gw.forEach((g, i) => expect(Math.abs(g - gr[i]) < 0.5, `block ${i} "${write[i].text}": ${g.toFixed(1)}px above in Write, ${gr[i].toFixed(1)}px in Read`));
  }
  const columnGaps = await browser.eval(`(() => ['[aria-label="Write"] .ProseMirror', '[aria-label="Read"]'].map((root) => {
    const cols = [...document.querySelectorAll(root + ' [data-column]')].filter((c) => c.parentElement);
    return cols.length > 1 ? cols[1].getBoundingClientRect().left - cols[0].getBoundingClientRect().right : null;
  }))()`);
  columnGaps.forEach((gap, i) => expect(gap === null || Math.abs(gap - COLUMN_GAP) < 0.5, `columns in ${["Write", "Read"][i]} are ${gap}px apart, not ${COLUMN_GAP}px`));
  if (shots) {
    fs.mkdirSync(shots, { recursive: true });
    await browser.shot(path.join(shots, "editor.png"));
  }
} finally {
  browser.close();
}
if (failures.length) {
  console.error(`layout check failed (${failures.length}):\n - ${failures.join("\n - ")}`);
  process.exit(1);
}
console.log("layout check passed: blocks a step apart plus the inset of each (the prose tokens), text blocks inset 4px, headings add their space and a tight line, columns 32px apart, Write and Read agree.");
