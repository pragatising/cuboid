import { smartLinkUrl } from "./smartLinkUrl";

describe("smartLinkUrl", () => {
  it.each([
    ["https://example.com/a?b=1#c", "https://example.com/a?b=1#c"],
    ["  http://localhost:3000/x  ", "http://localhost:3000/x"],
    ["example.com/docs", "https://example.com/docs"],
    ["www.figma.com/design/abc", "https://www.figma.com/design/abc"],
  ])("keeps %s as %s", (typed, kept) => expect(smartLinkUrl(typed)).toBe(kept));

  it.each(["", "   ", "javascript:alert(1)", "data:text/html,hi", "file:///etc/passwd", "ftp://x.com", "not a url", "two words.com", "localhost", "/site/path"])("refuses %j", (typed) => {
    expect(smartLinkUrl(typed)).toBeNull();
  });
});
