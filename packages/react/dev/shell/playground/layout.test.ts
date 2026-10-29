import { describe, expect, it } from "vitest";
import { CARD, LINE, MARGIN, place } from "./layout";

const wide = 2 * MARGIN + LINE + CARD;

describe("where an example's card goes", () => {
  it("puts a card beside a component with a size of its own when both fit", () => {
    expect(place([{ natural: 100, fluid: false }], wide + 100).layouts).toEqual(["beside"]);
  });

  it("puts it below when they do not fit", () => {
    expect(place([{ natural: 100, fluid: false }], wide + 99).layouts).toEqual(["above"]);
    expect(place([{ natural: 400, fluid: false }], wide + 100).layouts).toEqual(["above"]);
  });

  it("always puts it below a component that fills its container, however much room there is", () => {
    expect(place([{ natural: 50, fluid: true }], 5000).layouts).toEqual(["above"]);
  });

  it("gives every row that goes beside one left column, as wide as the widest of them", () => {
    const { layouts, left } = place(
      [
        { natural: 90, fluid: false },
        { natural: 300, fluid: false },
        { natural: 900, fluid: false },
        { natural: 40, fluid: true },
      ],
      wide + 500,
    );
    expect(layouts).toEqual(["beside", "beside", "above", "above"]);
    expect(left).toBe(300);
  });

  it("has no left column when nothing goes beside", () => {
    expect(place([{ natural: 40, fluid: true }], 3000).left).toBe(0);
  });
});
