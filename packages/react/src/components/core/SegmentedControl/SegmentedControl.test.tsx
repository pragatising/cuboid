import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { expectNoAxeViolations } from "../../../test/testing";
import { cubeVariablesRead, readSource, resolveVariable, themeVariables } from "../../../test/themeCss";
import { Icon } from "../Icon";
import { SegmentedControl } from "./SegmentedControl";

const Views = (props: Partial<React.ComponentProps<typeof SegmentedControl>>) => (
  <SegmentedControl aria-label="View" {...props}>
    <SegmentedControl.Item value="states">States</SegmentedControl.Item>
    <SegmentedControl.Item value="anatomy">Anatomy</SegmentedControl.Item>
    <SegmentedControl.Item value="example" disabled>
      Example
    </SegmentedControl.Item>
  </SegmentedControl>
);

const item = (name: string) => screen.getByRole("button", { name });

describe("SegmentedControl: element", () => {
  it("is a named group of buttons", () => {
    render(<Views />);
    expect(screen.getByRole("group", { name: "View" })).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  it("names its parts", () => {
    const { container } = render(<Views />);
    expect(container.querySelector('[data-component="SegmentedControl"]')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-component="SegmentedControl.Item"]')).toHaveLength(3);
  });

  it("passes other attributes and the ref to the root", () => {
    const ref = React.createRef<HTMLDivElement>();
    const { container } = render(<Views className="mine" data-extra="y" ref={ref} />);
    const root = container.querySelector('[data-component="SegmentedControl"]');
    expect(root).toHaveClass("mine");
    expect(root).toHaveAttribute("data-extra", "y");
    expect(ref.current).toBe(root);
  });

  it("throws, helpfully, for an item outside a control", () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<SegmentedControl.Item value="x">X</SegmentedControl.Item>)).toThrow(/inside a SegmentedControl/);
    quiet.mockRestore();
  });
});

describe("SegmentedControl: choosing", () => {
  it("has no item chosen without a value or a defaultValue", () => {
    render(<Views />);
    for (const button of screen.getAllByRole("button")) expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("starts with the defaultValue chosen, and moves the choice with a click", async () => {
    render(<Views defaultValue="states" />);
    expect(item("States")).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(item("Anatomy"));
    expect(item("Anatomy")).toHaveAttribute("aria-pressed", "true");
    expect(item("States")).toHaveAttribute("aria-pressed", "false");
  });

  it("chooses with Enter and Space on a focused item", async () => {
    render(<Views defaultValue="states" />);
    item("Anatomy").focus();
    await userEvent.keyboard("{Enter}");
    expect(item("Anatomy")).toHaveAttribute("aria-pressed", "true");
    item("States").focus();
    await userEvent.keyboard(" ");
    expect(item("States")).toHaveAttribute("aria-pressed", "true");
  });

  it("calls onValueChange with the value of the chosen item, once, and not for the one already chosen", async () => {
    const onValueChange = vi.fn();
    render(<Views defaultValue="states" onValueChange={onValueChange} />);
    await userEvent.click(item("States"));
    expect(onValueChange).not.toHaveBeenCalled();
    await userEvent.click(item("Anatomy"));
    expect(onValueChange.mock.calls).toEqual([["anatomy"]]);
  });

  it("follows `value` when controlled, and only asks to change", async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<Views value="states" onValueChange={onValueChange} />);
    await userEvent.click(item("Anatomy"));
    expect(onValueChange).toHaveBeenCalledWith("anatomy");
    expect(item("States")).toHaveAttribute("aria-pressed", "true");
    rerender(<Views value="anatomy" onValueChange={onValueChange} />);
    expect(item("Anatomy")).toHaveAttribute("aria-pressed", "true");
  });

  it("cannot choose a disabled item", async () => {
    const onValueChange = vi.fn();
    render(<Views defaultValue="states" onValueChange={onValueChange} />);
    expect(item("Example")).toBeDisabled();
    await userEvent.click(item("Example"));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("lets an item's own onClick cancel the choice", async () => {
    render(
      <SegmentedControl aria-label="A" defaultValue="a">
        <SegmentedControl.Item value="a">A</SegmentedControl.Item>
        <SegmentedControl.Item value="b" onClick={(event) => event.preventDefault()}>
          B
        </SegmentedControl.Item>
      </SegmentedControl>,
    );
    await userEvent.click(item("B"));
    expect(item("A")).toHaveAttribute("aria-pressed", "true");
  });
});

describe("SegmentedControl: look", () => {
  it("draws the chosen item as a secondary Button and the others as ghost", () => {
    render(<Views defaultValue="states" />);
    expect(item("States")).toHaveAttribute("data-variant", "secondary");
    expect(item("Anatomy")).toHaveAttribute("data-variant", "ghost");
  });

  it("gives every item the control's size, sm by default", () => {
    const { rerender } = render(<Views />);
    for (const button of screen.getAllByRole("button")) expect(button).toHaveAttribute("data-size", "sm");
    rerender(<Views size="lg" />);
    for (const button of screen.getAllByRole("button")) expect(button).toHaveAttribute("data-size", "lg");
  });

  it("shows leading and trailing visuals, and an icon-only item is named by its aria-label", () => {
    render(
      <SegmentedControl aria-label="Layout">
        <SegmentedControl.Item value="list" leadingVisual={<Icon name="list" />}>
          List
        </SegmentedControl.Item>
        <SegmentedControl.Item value="grid" aria-label="Grid" leadingVisual={<Icon name="grid_view" />} />
      </SegmentedControl>,
    );
    expect(item("List").querySelector('[data-component="leadingVisual"]')).toBeInTheDocument();
    expect(item("Grid")).toBeInTheDocument();
  });
});

describe("SegmentedControl: accessibility", () => {
  it("has no axe violations", async () => {
    const { container } = render(<Views defaultValue="states" />);
    await expectNoAxeViolations(container);
  });
});

describe("SegmentedControl: tokens", () => {
  it("reads only --cube-* variables that exist in the built theme.css, in both modes", () => {
    const read = cubeVariablesRead(readSource("src/components/core/SegmentedControl/SegmentedControl.module.css"));
    expect(read.length).toBeGreaterThan(0);
    for (const variable of read) {
      expect(themeVariables().light.has(variable), `${variable} (light)`).toBe(true);
      expect(themeVariables().dark.has(variable), `${variable} (dark)`).toBe(true);
    }
  });

  it.each(["light", "dark"] as const)("resolves the strip and the unselected text to tokens.%s.segmentedControl", (mode) => {
    const { segmentedControl } = tokens[mode];
    expect(resolveVariable("--cube-segmentedControl-bgColor", mode)).toBe(segmentedControl.bgColor);
    expect(resolveVariable("--cube-segmentedControl-item-fgColor-rest", mode)).toBe(segmentedControl.item.fgColor.rest);
  });

  it("does not inline any colour on the elements", () => {
    const { container } = render(<Views defaultValue="states" />);
    expect(container.querySelector("[style]")).toBeNull();
  });
});
