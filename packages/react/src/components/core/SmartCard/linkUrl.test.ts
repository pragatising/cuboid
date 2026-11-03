import { describe, expect, it } from "vitest";
import { parseLinkUrl } from "./linkUrl";

describe("parseLinkUrl", () => {
  const base = "https://site.test/page";

  it("takes http(s) URLs and resolves site paths against the base", () => {
    expect(parseLinkUrl("https://a.com/x", base)?.href).toBe("https://a.com/x");
    expect(parseLinkUrl("/storybook/iframe.html", base)?.href).toBe("https://site.test/storybook/iframe.html");
  });

  it.each(["javascript:alert(1)", "data:text/html,hi", "file:///etc/passwd"])("rejects %s", (src) => {
    expect(parseLinkUrl(src, base)).toBeNull();
  });
});
