import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { tokenName } from "./tokenName.ts";

describe("tokenName", () => {
  it("accepts camelCase", () => {
    assert.ok(tokenName.safeParse("borderRadius").success);
  });

  it("accepts kebab-case", () => {
    assert.ok(tokenName.safeParse("border-radius").success);
  });

  it("accepts a name starting with a digit", () => {
    assert.ok(tokenName.safeParse("2xl").success);
  });

  it("accepts a bare decimal fraction — real usage: shadowAlpha.black['0.05']", () => {
    assert.ok(tokenName.safeParse("0.05").success);
    assert.ok(tokenName.safeParse("0.625").success);
  });

  it("rejects a name starting with an uppercase letter", () => {
    assert.ok(!tokenName.safeParse("BorderRadius").success);
  });

  it("rejects a decimal fraction with no leading zero", () => {
    assert.ok(!tokenName.safeParse("1.5").success, "the real usage is only ever a sub-1 alpha value — 0.NNN");
  });

  it("rejects an empty string", () => {
    assert.ok(!tokenName.safeParse("").success);
  });

  it("rejects a name with a space", () => {
    assert.ok(!tokenName.safeParse("border radius").success);
  });
});
