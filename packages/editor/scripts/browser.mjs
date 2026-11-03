// A small Chrome driver for checks jsdom cannot make (layout, the cascade, contrast): launches headless Chrome and talks to it over the debugging protocol.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

export async function open({ width = 1500, height = 1100, scale = 1 } = {}) {
  const port = 9600 + Math.floor(Math.random() * 300);
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cuboid-cdp-"));
  const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, `--window-size=${width},${height}`, "--hide-scrollbars", `--force-device-scale-factor=${scale}`, "about:blank"], { stdio: "ignore" });
  for (let i = 0; i < 80; i++) {
    try { if ((await fetch(`http://127.0.0.1:${port}/json/version`)).ok) break; } catch {}
    await sleep(250);
  }
  const tab = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pending = new Map(); const listeners = [];
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } else if (m.method) listeners.forEach((l) => l(m)); };
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, (m) => (m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result))); ws.send(JSON.stringify({ id: i, method, params })); });
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: scale, mobile: false });
  const api = {
    send,
    async goto(url) {
      const loaded = new Promise((r) => listeners.push((m) => m.method === "Page.loadEventFired" && r()));
      await send("Page.navigate", { url }); await loaded; await sleep(900);
    },
    async eval(expr) {
      const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? "eval failed");
      return r.result.value;
    },
    async shot(file, clip) {
      const r = await send("Page.captureScreenshot", { format: "png", ...(clip ? { clip: { ...clip, scale: 1 } } : {}) });
      fs.writeFileSync(file, Buffer.from(r.data, "base64")); return file;
    },
    async mouse(type, x, y, extra = {}) { await send("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: 1, ...extra }); },
    async click(x, y) { await api.mouse("mouseMoved", x, y); await api.mouse("mousePressed", x, y); await api.mouse("mouseReleased", x, y); await sleep(250); },
    async key(key, opts = {}) { await send("Input.dispatchKeyEvent", { type: "keyDown", key, ...opts }); await send("Input.dispatchKeyEvent", { type: "keyUp", key, ...opts }); await sleep(120); },
    async type(text) { await send("Input.insertText", { text }); await sleep(150); },
    sleep,
    close() { try { ws.close(); } catch {} chrome.kill(); },
  };
  return api;
}
