import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { setMode } from "../mode";

// jsdom has no layout engine, so no ResizeObserver; components that observe their size just never get a callback.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

afterEach(() => {
  cleanup();
  setMode("light"); // the mode store is module-level state; never let one test's mode leak into the next
});
