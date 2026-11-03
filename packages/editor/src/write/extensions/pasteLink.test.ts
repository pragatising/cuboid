import { describe, expect, it } from "vitest";
import { pastedLinkUrl } from "./pasteLink";

describe("pastedLinkUrl", () => {
  it("takes one http(s) URL", () => {
    expect(pastedLinkUrl(" https://example.com/a?b=1 \n")).toBe("https://example.com/a?b=1");
  });
  it("takes the src of pasted iframe code", () => {
    expect(pastedLinkUrl('<iframe width="560" src="https://example.com/embed/1" allowfullscreen></iframe>')).toBe("https://example.com/embed/1");
    expect(pastedLinkUrl("<iframe src='https://example.com/x'></iframe>")).toBe("https://example.com/x");
  });
  it("leaves text, bare hosts, other schemes and sentences alone", () => {
    for (const text of ["hello", "example.com", "file.txt", "javascript:alert(1)", "see https://example.com now", '<iframe src="javascript:alert(1)"></iframe>', '<iframe src="/relative"></iframe>']) {
      expect(pastedLinkUrl(text)).toBeNull();
    }
  });
});
