import { safeHref } from "./link";

describe("safeHref", () => {
  it.each([
    ["https://example.com", "https://example.com"],
    ["http://example.com/a?b=1#c", "http://example.com/a?b=1#c"],
    ["example.com", "https://example.com"],
    ["example.com/path", "https://example.com/path"],
    ["  www.example.com  ", "https://www.example.com"],
    ["mailto:a@b.co", "mailto:a@b.co"],
    ["tel:+4412345", "tel:+4412345"],
    ["/docs/page", "/docs/page"],
    ["#section", "#section"],
    ["../up", "../up"],
  ])("accepts %s", (input, expected) => expect(safeHref(input)).toBe(expected));

  it.each([["javascript:alert(1)"], ["JavaScript:alert(1)"], ["data:text/html,<script>"], ["vbscript:x"], ["file:///etc/passwd"], ["ftp://x.com"], [""], ["   "], ["two words"], ["nodots"], ["java script:x"]])(
    "refuses %s",
    (input) => expect(safeHref(input)).toBeNull(),
  );
});
