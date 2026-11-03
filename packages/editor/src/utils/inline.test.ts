import { formatDate, isPillIntensity, isPillShade, todayIso } from "./inline";

describe("formatDate", () => {
  it("formats a calendar day in the given locale", () => {
    expect(formatDate("2026-11-12", "en-US")).toBe("Nov 12, 2026");
    expect(formatDate("2026-01-01", "en-GB")).toBe("1 Jan 2026");
  });

  it("is not moved by the time zone: a day is a day", () => {
    expect(formatDate("2026-03-01", "en-US")).toBe("Mar 1, 2026");
    expect(formatDate("2026-12-31", "en-US")).toBe("Dec 31, 2026");
  });

  it("shows what was written when it is not a real date", () => {
    expect(formatDate("2026-02-30")).toBe("2026-02-30");
    expect(formatDate("soon")).toBe("soon");
    expect(formatDate("")).toBe("");
  });
});

describe("todayIso", () => {
  it("is the local calendar day, zero padded", () => {
    expect(todayIso(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(todayIso(new Date(2026, 10, 12, 23, 59))).toBe("2026-11-12");
  });
});

describe("pill guards", () => {
  it("accepts Cuboid's shades and intensities only", () => {
    expect(isPillShade("mag")).toBe(true);
    expect(isPillShade("pink")).toBe(false);
    expect(isPillIntensity("extraBold")).toBe(true);
    expect(isPillIntensity("heavy")).toBe(false);
  });
});
