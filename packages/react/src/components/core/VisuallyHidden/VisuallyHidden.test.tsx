import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { behavesAsComponent } from "../../../test/testing";
import { VisuallyHidden } from "./VisuallyHidden";

behavesAsComponent({ Component: VisuallyHidden, dataComponent: "VisuallyHidden", props: { children: "text" } });

describe("VisuallyHidden", () => {
  it("keeps its text in the accessibility tree, out of sight", () => {
    render(<button>Save<VisuallyHidden> (opens in a new tab)</VisuallyHidden></button>);
    expect(screen.getByRole("button", { name: /Save.*opens in a new tab/ })).toBeInTheDocument();
    const hidden = screen.getByText("(opens in a new tab)");
    expect(hidden).toHaveStyle({ position: "absolute", width: "1px", height: "1px", overflow: "hidden" });
  });

  it("is a span, and can be another element", () => {
    const { rerender, container } = render(<VisuallyHidden>x</VisuallyHidden>);
    expect(container.firstElementChild?.tagName).toBe("SPAN");
    rerender(<VisuallyHidden as="div">x</VisuallyHidden>);
    expect(container.firstElementChild?.tagName).toBe("DIV");
  });
});
