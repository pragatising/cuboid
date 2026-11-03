import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// jsdom has no layout engine, so no ResizeObserver; views that observe their size just never get a callback.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// ProseMirror measures ranges to scroll the caret into view (on undo, on typing). jsdom has no layout, so every range is empty.
const emptyRects = () => Object.assign([], { item: () => null }) as unknown as DOMRectList;
const emptyRect = () => new DOMRect(0, 0, 0, 0);
Range.prototype.getClientRects ??= emptyRects;
Range.prototype.getBoundingClientRect ??= emptyRect;
(Text.prototype as unknown as { getClientRects?: () => DOMRectList }).getClientRects ??= emptyRects;

afterEach(() => cleanup());
