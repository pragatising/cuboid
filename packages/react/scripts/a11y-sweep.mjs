#!/usr/bin/env node
// Runs axe-core, with colour contrast ON, in real Chrome against the Storybook stories, in light and dark, and exits 1 on any
// violation. jsdom cannot compute contrast or layout, which is why the unit tests (expectNoAxeViolations) run with that rule off.
//
//   npm run storybook            # in one terminal (or STORYBOOK_URL=… for a running or deployed one)
//   npm run a11y:sweep           # every story
//   npm run a11y:sweep -- --filter core-select,core-inputtext --shots
//
// Options: --filter <story id prefixes, comma separated>   --shots (write a PNG per run)   --out <dir> (default .a11y-sweep)
// Env: STORYBOOK_URL (default http://localhost:6006), CHROME_PATH (default: the macOS Chrome app, or `google-chrome`).
//
// Stories whose popup is closed until used are opened with a real mouse click first (OPEN_STATES), so the popup is checked too.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name) => (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : undefined);

const STORYBOOK = (process.env.STORYBOOK_URL ?? "http://localhost:6006").replace(/\/$/, "");
const OUT = path.resolve(option("out") ?? ".a11y-sweep");
const FILTER = option("filter")?.split(",").filter(Boolean);
const PORT = 9333 + Math.floor(Math.random() * 500);
const MODES = ["light", "dark"];

/** Story id -> the selector to click (with the mouse) to open its popup. */
const OPEN_STATES = {
  "core-select--default": '[role="combobox"]',
  "core-select--with-sections-and-visuals": '[role="combobox"]',
  "core-autocomplete--default": '[role="combobox"]',
  "core-autocomplete--with-descriptions": '[role="combobox"]',
  "core-autocomplete--loading": '[role="combobox"]',
  "core-autocomplete--create-new": '[role="combobox"]',
  "core-autocomplete--nothing-matches": '[role="combobox"]',
  "core-select--loading": '[role="combobox"]',
  "core-actionmenu--with-search": "#storybook-root button",
  "core-actionmenu--with-header-and-footer": "#storybook-root button",
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const require = createRequire(import.meta.url);
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

function chromePath() {
  const candidates = [process.env.CHROME_PATH, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "google-chrome", "chromium"].filter(Boolean);
  for (const candidate of candidates) {
    if (candidate.includes("/") ? fs.existsSync(candidate) : true) return candidate;
  }
  throw new Error("No Chrome found: set CHROME_PATH.");
}

async function until(fn, what, tries = 80) {
  for (let i = 0; i < tries; i++) {
    try {
      const value = await fn();
      if (value) return value;
    } catch {
      /* not ready yet */
    }
    await sleep(250);
  }
  throw new Error(`Timed out waiting for ${what}`);
}

fs.mkdirSync(OUT, { recursive: true });
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cuboid-a11y-"));
const chrome = spawn(chromePath(), ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "--window-size=720,900", "--hide-scrollbars", "--force-device-scale-factor=2", "about:blank"], { stdio: "ignore" });

let exitCode = 0;
try {
  const index = await until(async () => (await fetch(`${STORYBOOK}/index.json`)).json(), `Storybook at ${STORYBOOK} (is it running?)`);
  await until(async () => (await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok, "Chrome");
  const tab = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve) => (ws.onopen = resolve));

  let nextId = 0;
  const pending = new Map();
  const listeners = [];
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    } else if (message.method) listeners.forEach((listener) => listener(message));
  };
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, (message) => (message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result)));
      ws.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? "evaluation failed");
    return result.result.value;
  };
  await send("Page.enable");

  const load = async (storyId, mode) => {
    const loaded = new Promise((resolve) => listeners.push((message) => message.method === "Page.loadEventFired" && resolve()));
    await send("Page.navigate", { url: `${STORYBOOK}/iframe.html?id=${storyId}&viewMode=story&globals=mode:${mode}` });
    await loaded;
    await until(() => evaluate("(document.querySelector('#storybook-root')?.children.length ?? 0) > 0"), `story ${storyId}`, 60);
    await sleep(300);
  };

  const click = async (selector) => {
    const point = await evaluate(`(() => { const e = document.querySelector(${JSON.stringify(selector)}); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
    if (!point) throw new Error(`nothing matches ${selector}`);
    for (const type of ["mouseMoved", "mousePressed", "mouseReleased"]) await send("Input.dispatchMouseEvent", { type, x: point.x, y: point.y, button: "left", clickCount: 1 });
  };

  // The `hidden` attribute is only the browser's default `display: none`: a component rule that sets `display` (even at zero
  // specificity) beats it, and the element stays on screen. jsdom does not load the CSS, so only a browser can see this.
  const hiddenButShown = () =>
    evaluate(`[...document.querySelectorAll('[hidden]')].filter((e) => getComputedStyle(e).display !== 'none').map((e) => ({ id: 'hidden-attribute-ignored', impact: 'serious', help: 'An element with the hidden attribute is still displayed (a component display rule overrides it)', nodes: [{ target: e.tagName.toLowerCase() + (e.getAttribute('data-component') ? '[data-component=' + e.getAttribute('data-component') + ']' : ''), data: null }] }))`);

  const audit = async () => {
    await evaluate(AXE);
    const found = await evaluate(`axe.run(document, { rules: { region: { enabled: false }, 'landmark-one-main': { enabled: false }, 'page-has-heading-one': { enabled: false } } }).then((r) => r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map((n) => ({ target: n.target.join(' '), data: (n.any[0] || {}).data && { fg: n.any[0].data.fgColor, bg: n.any[0].data.bgColor, ratio: n.any[0].data.contrastRatio, size: n.any[0].data.fontSize } })) })))`);
    return [...found, ...(await hiddenButShown())];
  };

  const shot = async (name) => {
    const { data } = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(OUT, `${name}.png`), Buffer.from(data, "base64"));
  };

  const stories = Object.keys(index.entries).filter((id) => index.entries[id].type === "story" && !id.endsWith("--docs") && (!FILTER || FILTER.some((prefix) => id.startsWith(prefix))));
  const results = [];
  for (const mode of MODES) {
    for (const story of stories) {
      await load(story, mode);
      results.push({ story, mode, state: "rest", violations: await audit() });
      if (flag("shots")) await shot(`${story}-${mode}`);
      if (OPEN_STATES[story]) {
        await click(OPEN_STATES[story]);
        await sleep(500);
        results.push({ story, mode, state: "open", violations: await audit() });
        if (flag("shots")) await shot(`${story}-${mode}-open`);
      }
    }
  }
  ws.close();

  fs.writeFileSync(path.join(OUT, "results.json"), JSON.stringify(results, null, 2));
  const failing = results.filter((run) => run.violations.length > 0);
  console.log(`${stories.length} stories, ${results.length} runs (${MODES.join(" and ")}, popups opened where there is one): ${results.length - failing.length} clean, ${failing.length} with violations.`);
  for (const run of failing) {
    for (const violation of run.violations) {
      console.log(`\n${run.story} [${run.mode}, ${run.state}] ${violation.id} (${violation.impact}): ${violation.help}`);
      for (const node of violation.nodes) console.log(`  ${node.target}${node.data ? `  ${node.data.fg} on ${node.data.bg} = ${node.data.ratio} (${node.data.size})` : ""}`);
    }
  }
  console.log(`\nDetails: ${path.join(OUT, "results.json")}`);
  if (failing.length > 0) exitCode = 1;
} catch (error) {
  console.error(error.message);
  exitCode = 2;
} finally {
  chrome.kill();
  await new Promise((resolve) => (chrome.exitCode === null ? chrome.once("exit", resolve) : resolve()));
  try {
    fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  } catch {
    /* a temp profile left behind is harmless */
  }
}
process.exit(exitCode);
