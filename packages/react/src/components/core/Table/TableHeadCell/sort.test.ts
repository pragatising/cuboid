import { describe, expect, it } from "vitest";
import { TABLE_SORTS } from "../constants";
import { ariaSort } from "./sort";

describe("ariaSort", () => {
  it("names each order in ARIA's words", () => {
    expect(ariaSort("asc")).toBe("ascending");
    expect(ariaSort("desc")).toBe("descending");
    expect(ariaSort("none")).toBe("none");
  });

  it("is absent for a column that cannot be sorted", () => {
    expect(ariaSort(undefined)).toBeUndefined();
  });

  it("answers every order the table knows", () => {
    for (const sort of TABLE_SORTS) expect(ariaSort(sort)).toBeDefined();
  });
});
