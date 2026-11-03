import { describe, expect, it } from "vitest";
import { embedFrameSize, resolveEmbedHeight } from "./frameSize";

describe("resolveEmbedHeight", () => {
  it("fits the content when unset and same-origin, else medium", () => {
    expect(resolveEmbedHeight(undefined, true)).toBe("auto");
    expect(resolveEmbedHeight(undefined, false)).toBe("md");
  });

  it("keeps an explicit choice", () => {
    expect(resolveEmbedHeight("16:9", false)).toBe("16:9");
    expect(resolveEmbedHeight("lg", true)).toBe("lg");
  });

  it("refuses auto where the content cannot be measured", () => {
    expect(resolveEmbedHeight("auto", false)).toBe("md");
    expect(resolveEmbedHeight("auto", true)).toBe("auto");
  });
});

describe("embedFrameSize", () => {
  it("gives pixels for the presets and a ratio for the ratios", () => {
    expect(embedFrameSize("md")).toEqual({ heightPx: 480 });
    expect(embedFrameSize("16:9")).toEqual({ aspectRatio: "16 / 9" });
  });
});
