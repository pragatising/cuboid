import { test } from "node:test";
import assert from "node:assert/strict";
import { log } from "./log.ts";

function captureConsole() {
  const calls = { log: [] as string[], warn: [] as string[], error: [] as string[] };
  const original = { log: console.log, warn: console.warn, error: console.error };
  console.log = (msg: string) => calls.log.push(msg);
  console.warn = (msg: string) => calls.warn.push(msg);
  console.error = (msg: string) => calls.error.push(msg);
  return {
    calls,
    restore: () => {
      console.log = original.log;
      console.warn = original.warn;
      console.error = original.error;
    },
  };
}

test("info logs via console.log by default (no config)", () => {
  const { calls, restore } = captureConsole();
  try {
    log.info("hello");
    assert.deepEqual(calls.log, ["hello"]);
  } finally {
    restore();
  }
});

test("warning logs via console.warn by default", () => {
  const { calls, restore } = captureConsole();
  try {
    log.warning("careful");
    assert.deepEqual(calls.warn, ["careful"]);
  } finally {
    restore();
  }
});

test("error always logs via console.error, even under silent verbosity", () => {
  const { calls, restore } = captureConsole();
  try {
    log.error("boom", { log: { verbosity: "silent" } });
    assert.deepEqual(calls.error, ["boom"]);
  } finally {
    restore();
  }
});

test("silent verbosity suppresses info and warning", () => {
  const { calls, restore } = captureConsole();
  try {
    log.info("hello", { log: { verbosity: "silent" } });
    log.warning("careful", { log: { verbosity: "silent" } });
    assert.deepEqual(calls.log, []);
    assert.deepEqual(calls.warn, []);
  } finally {
    restore();
  }
});

test("default verbosity suppresses info but keeps warning", () => {
  const { calls, restore } = captureConsole();
  try {
    log.info("hello", { log: { verbosity: "default" } });
    log.warning("careful", { log: { verbosity: "default" } });
    assert.deepEqual(calls.log, []);
    assert.deepEqual(calls.warn, ["careful"]);
  } finally {
    restore();
  }
});

test("disabled warnings suppress both info and warning", () => {
  const { calls, restore } = captureConsole();
  try {
    log.info("hello", { log: { warnings: "disabled" } });
    log.warning("careful", { log: { warnings: "disabled" } });
    assert.deepEqual(calls.log, []);
    assert.deepEqual(calls.warn, []);
  } finally {
    restore();
  }
});
