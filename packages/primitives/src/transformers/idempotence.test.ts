import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Config, PlatformConfig, TransformedToken } from "style-dictionary/types";
import { dimensionToRem } from "./dimensionToRem.ts";
import { dimensionToPixelUnitless } from "./dimensionToPixelUnitless.ts";
import { dimensionToRemPxArray } from "./dimensionToRemPxArray.ts";
import { durationToCss } from "./durationToCss.ts";
import { cubicBezierToCss } from "./cubicBezierToCss.ts";
import { typographyToCss } from "./typographyToCss.ts";

/**
 * Regression tests for the transitive double-transform bug — see
 * transformers/utilities/isAlreadyTransformed.ts for the mechanism.
 *
 * Every transform here is `transitive: true`, which means Style
 * Dictionary WILL run it a second time on a value that arrived by
 * reference resolution from an already-transformed token. Running twice
 * must be equivalent to running once. Without this, an alias like
 * `container.maxWidth.page: '{layout.pageMaxWidth}'` raised a transform
 * error (208 of them at one point) and Style Dictionary silently
 * substituted the untransformed value — it does NOT fail the build, so
 * only an assertion like this catches a regression.
 */

const config = { basePxFontSize: 16 } as PlatformConfig;
const options = { usesDtcg: true } as Config;

function token(value: unknown, extra: Record<string, unknown> = {}): TransformedToken {
  return {
    name: "test-token",
    path: ["test", "token"],
    $value: value,
    original: { $value: value },
    filePath: "src/tokens/functional/test.json5",
    isSource: true,
    ...extra,
  } as unknown as TransformedToken;
}

function runTwice(transform: typeof dimensionToRem, initial: unknown, extra?: Record<string, unknown>) {
  const first = transform.transform(token(initial, extra), config, options);
  const second = transform.transform(token(first, extra), config, options);
  return { first, second };
}

describe("dimension/rem is idempotent", () => {
  it("px -> rem, then unchanged on a second pass", () => {
    const { first, second } = runTwice(dimensionToRem, { value: 24, unit: "px" });
    assert.equal(first, "1.5rem");
    assert.equal(second, "1.5rem");
  });

  it("rem passes through and stays stable", () => {
    const { first, second } = runTwice(dimensionToRem, { value: 56, unit: "rem" });
    assert.equal(first, "56rem");
    assert.equal(second, "56rem");
  });

  it("zero stays '0'", () => {
    const { first, second } = runTwice(dimensionToRem, { value: 0, unit: "px" });
    assert.equal(first, "0");
    assert.equal(second, "0");
  });
});

describe("dimension/pixelUnitless is idempotent", () => {
  it("returns a bare number once, then leaves a string second pass alone", () => {
    const first = dimensionToPixelUnitless.transform(token({ value: 1, unit: "rem" }), config, options);
    assert.equal(first, 16);
    // A number is not "already transformed" — only a string is — but the
    // real second pass only ever sees the string form via resolution.
    const second = dimensionToPixelUnitless.transform(token("1.5rem"), config, options);
    assert.equal(second, "1.5rem");
  });
});

describe("dimension/remPxArray is idempotent", () => {
  it("returns the [rem, px] pair once, and passes a resolved string through", () => {
    const first = dimensionToRemPxArray.transform(token({ value: 16, unit: "px" }), config, options);
    assert.deepEqual(first, ["1rem", "16px"]);
    const second = dimensionToRemPxArray.transform(token("1rem"), config, options);
    assert.equal(second, "1rem");
  });
});

describe("duration/css is idempotent", () => {
  it("ms -> css string, then unchanged", () => {
    const { first, second } = runTwice(durationToCss, { value: 100, unit: "ms" });
    assert.equal(first, "100ms");
    assert.equal(second, "100ms");
  });

  it("s -> ms, then unchanged", () => {
    const { first, second } = runTwice(durationToCss, { value: 0.25, unit: "s" });
    assert.equal(first, "250ms");
    assert.equal(second, "250ms");
  });
});

describe("cubicBezier/css is idempotent", () => {
  it("array -> cubic-bezier(), then unchanged", () => {
    const { first, second } = runTwice(cubicBezierToCss, [0.3, 0.8, 0.6, 1]);
    assert.equal(first, "cubic-bezier(0.3,0.8,0.6,1)");
    assert.equal(second, "cubic-bezier(0.3,0.8,0.6,1)");
  });
});

describe("typography/css is idempotent", () => {
  it("composite -> font shorthand, then unchanged", () => {
    const composite = {
      fontWeight: 400,
      fontSize: "1rem",
      lineHeight: 1.5,
      fontFamily: "Inter",
    };
    const { first, second } = runTwice(typographyToCss, composite);
    assert.equal(first, "400 1rem/1.5 Inter");
    assert.equal(second, "400 1rem/1.5 Inter");
  });
});
