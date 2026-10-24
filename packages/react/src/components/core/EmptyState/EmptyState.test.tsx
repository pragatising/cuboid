import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { behavesAsComponent, expectNoAxeViolations } from "../../../test/testing";
import { EmptyState } from "./EmptyState";
import classes from "./EmptyState.module.css";

behavesAsComponent({ Component: EmptyState, dataComponent: "EmptyState", baseClassName: classes.EmptyState, props: { heading: "Nothing here" } });

const root = (container: HTMLElement) => container.querySelector('[data-component="EmptyState"]') as HTMLElement;

describe("EmptyState", () => {
  it("shows the icon, heading and description", () => {
    const { container } = render(<EmptyState icon="celebration" heading="No results" description="Try a different search" />);
    expect(container.querySelector('[data-component="TileIcon"]')).toBeInTheDocument();
    expect(screen.getByText("No results")).toBeInTheDocument();
    expect(screen.getByText("Try a different search")).toBeInTheDocument();
  });

  it("leaves out the parts it is not given", () => {
    const { container } = render(<EmptyState description="Only text" />);
    expect(container.querySelector('[data-component="TileIcon"]')).toBeNull();
    expect(screen.queryByText("No results")).toBeNull();
    expect(screen.getByText("Only text")).toBeInTheDocument();
  });

  it("defaults to the stacked layout, and layout is an attribute", () => {
    const { container, rerender } = render(<EmptyState heading="H" />);
    expect(root(container)).toHaveAttribute("data-layout", "default");
    rerender(<EmptyState heading="H" layout="compact" description="D" />);
    expect(root(container)).toHaveAttribute("data-layout", "compact");
  });

  it("compact puts the icon beside the description and has no heading", () => {
    const { container } = render(<EmptyState layout="compact" icon="celebration" heading="Hidden" description="Nothing yet" />);
    expect(screen.queryByText("Hidden")).toBeNull();
    expect(root(container).children[0]).toHaveAttribute("data-component", "TileIcon");
    expect(root(container)).toHaveTextContent("Nothing yet");
  });

  it("passes iconProps to the tile", () => {
    const { container } = render(<EmptyState icon="celebration" iconProps={{ backgroundColor: "#ff0000" }} description="D" />);
    expect(container.querySelector('[data-component="TileIcon"]')).toHaveStyle({ backgroundColor: "#ff0000" });
  });

  it("can be a status region, so it is announced when it appears", () => {
    render(<EmptyState role="status" heading="No results" />);
    expect(screen.getByRole("status")).toHaveTextContent("No results");
  });

  it("sets no inline style on the root: the spacing is CSS", () => {
    const { container } = render(<EmptyState heading="H" />);
    expect(root(container).getAttribute("style")).toBeNull();
  });

  it("has no axe violations", async () => {
    const { container } = render(<EmptyState icon="celebration" heading="No results" description="Try again" />);
    await expectNoAxeViolations(container);
  });
});
