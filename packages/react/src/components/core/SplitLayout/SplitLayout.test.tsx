import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { behavesAsComponent, expectNoAxeViolations } from "../../../test/testing";
import { SplitLayout } from "./SplitLayout";
import classes from "./SplitLayout.module.css";

behavesAsComponent({ Component: SplitLayout, dataComponent: "SplitLayout", baseClassName: classes.SplitLayout });

describe("SplitLayout", () => {
  it("holds a leading panel and a main region", () => {
    render(
      <SplitLayout>
        <nav aria-label="Side">Side</nav>
        <SplitLayout.Main>Content</SplitLayout.Main>
      </SplitLayout>,
    );
    expect(screen.getByRole("navigation", { name: "Side" })).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveTextContent("Content");
    expect(screen.getByRole("main")).toHaveAttribute("data-component", "SplitLayout.Main");
  });

  it("merges a className and style onto Main", () => {
    render(
      <SplitLayout>
        <SplitLayout.Main className="mine" style={{ opacity: 0.5 }}>x</SplitLayout.Main>
      </SplitLayout>,
    );
    expect(screen.getByRole("main")).toHaveClass("mine");
    expect(screen.getByRole("main")).toHaveStyle({ opacity: "0.5" });
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <SplitLayout>
        <SplitLayout.Main>Content</SplitLayout.Main>
      </SplitLayout>,
    );
    await expectNoAxeViolations(container);
  });
});
