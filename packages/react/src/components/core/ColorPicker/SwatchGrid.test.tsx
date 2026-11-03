import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../../../test/testing";
import { cubeVariablesRead, readSource, themeVariables } from "../../../test/themeCss";
import { SwatchGrid } from "./SwatchGrid";
import type { SwatchGroup } from "./SwatchGrid";

const rows: SwatchGroup[] = [
  { label: "Light", swatches: [{ value: "a", color: "#ffffff", label: "White" }, { value: "b", color: "#cccccc" }, { value: "c", color: "#aaaaaa" }] },
  { label: "Dark", swatches: [{ value: "d", color: "#333333" }, { value: "e", color: "#111111" }, { value: "f", color: "#000000" }] },
];

const grid = (props: Partial<React.ComponentProps<typeof SwatchGrid>> = {}) => render(<SwatchGrid aria-label="Colour" groups={rows} {...props} />);

describe("SwatchGrid", () => {
  it("is in the page, not behind a button: a named group of radios, a radio group for each row", () => {
    grid();
    const whole = screen.getByRole("group", { name: "Colour" });
    expect(within(whole).getAllByRole("radiogroup").map((g) => g.getAttribute("aria-label"))).toEqual(["Light", "Dark"]);
    expect(within(whole).getAllByRole("radio")).toHaveLength(6);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("draws no headings unless asked, and the row labels still name the rows", () => {
    const { rerender } = grid();
    expect(screen.queryByText("Light")).toBeNull();
    rerender(<SwatchGrid aria-label="Colour" groups={rows} showLabels />);
    expect(screen.getByText("Light")).toBeInTheDocument();
    expect(screen.getByText("Dark")).toBeInTheDocument();
  });

  it("names a swatch by its label, or its value", () => {
    grid();
    expect(screen.getByRole("radio", { name: "White" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "b" })).toBeInTheDocument();
  });

  it("reports the swatch chosen and stays where it is: choosing is not closing", async () => {
    const onValueChange = vi.fn();
    grid({ onValueChange });
    await userEvent.click(screen.getByRole("radio", { name: "d" }));
    expect(onValueChange).toHaveBeenCalledWith("d");
    expect(screen.getAllByRole("radio")).toHaveLength(6);
  });

  it("marks the one chosen, and shows only what it is given", () => {
    const { rerender } = grid({ value: "c" });
    expect(screen.getByRole("radio", { name: "c" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getAllByRole("radio").filter((r) => r.getAttribute("aria-checked") === "true")).toHaveLength(1);
    rerender(<SwatchGrid aria-label="Colour" groups={rows} value="e" />);
    expect(screen.getByRole("radio", { name: "e" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "c" })).toHaveAttribute("aria-checked", "false");
  });

  it("outlines only a swatch that would be lost on the page", () => {
    grid();
    expect(screen.getByRole("radio", { name: "White" })).toHaveAttribute("data-outline");
    expect(screen.getByRole("radio", { name: "f" })).not.toHaveAttribute("data-outline");
  });

  describe("no colour", () => {
    const withNone = (selected: boolean, onSelect = vi.fn()) => grid({ none: { selected, onSelect } });

    it("is a radio, first in the grid, named None, and not there unless asked for", () => {
      withNone(false);
      const radios = screen.getAllByRole("radio");
      expect(radios).toHaveLength(7);
      expect(radios[0]).toHaveAccessibleName("None");
      expect(radios[0]).toHaveAttribute("data-none");
    });

    it("has no letter on it, whatever the appearance, and is not outlined as a pale colour", () => {
      grid({ appearance: "text", none: { selected: false, onSelect: vi.fn() } });
      expect(screen.getByRole("radio", { name: "None" })).toHaveTextContent("");
      expect(screen.getByRole("radio", { name: "None" })).not.toHaveAttribute("data-outline");
    });

    it("can be called something else", () => {
      grid({ none: { label: "No highlight", selected: false, onSelect: vi.fn() } });
      expect(screen.getByRole("radio", { name: "No highlight" })).toBeInTheDocument();
    });

    it("says it is the one chosen, and so no swatch is", () => {
      withNone(true);
      expect(screen.getByRole("radio", { name: "None" })).toHaveAttribute("aria-checked", "true");
      expect(screen.getAllByRole("radio").filter((r) => r.getAttribute("aria-checked") === "true")).toHaveLength(1);
    });

    it("reports when it is chosen, and does not report a value", async () => {
      const onSelect = vi.fn();
      const onValueChange = vi.fn();
      grid({ onValueChange, none: { selected: false, onSelect } });
      await userEvent.click(screen.getByRole("radio", { name: "None" }));
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("is the stop in the tab order when it is chosen, or when nothing is, and a swatch when one is", () => {
      const stops = () => screen.getAllByRole("radio").filter((r) => r.tabIndex === 0).map((r) => r.getAttribute("aria-label"));
      const { rerender } = withNone(true);
      expect(stops()).toEqual(["None"]);
      rerender(<SwatchGrid aria-label="Colour" groups={rows} none={{ selected: false, onSelect: vi.fn() }} />);
      expect(stops()).toEqual(["None"]);
      rerender(<SwatchGrid aria-label="Colour" groups={rows} value="e" none={{ selected: false, onSelect: vi.fn() }} />);
      expect(stops()).toEqual(["e"]);
    });

    it("is reached with the arrow keys like the swatches, and has no axe violations", async () => {
      const { container } = withNone(false);
      screen.getByRole("radio", { name: "None" }).focus();
      await userEvent.keyboard("{ArrowRight}");
      expect(screen.getByRole("radio", { name: "White" })).toHaveFocus();
      await userEvent.keyboard("{ArrowLeft}");
      expect(screen.getByRole("radio", { name: "None" })).toHaveFocus();
      await expectNoAxeViolations(container);
    });
  });

  describe("appearance", () => {
    it("is a square of the colour by default", () => {
      grid();
      const swatch = screen.getByRole("radio", { name: "c" });
      expect(swatch).toHaveAttribute("data-appearance", "fill");
      expect(swatch).toHaveTextContent("");
    });

    it("puts an A on the colour for a highlight, and draws an A in the colour for a text colour", () => {
      const { rerender } = grid({ appearance: "highlight" });
      expect(screen.getByRole("radio", { name: "c" })).toHaveTextContent("A");
      expect(screen.getByRole("radio", { name: "c" })).toHaveAttribute("data-appearance", "highlight");
      rerender(<SwatchGrid aria-label="Colour" groups={rows} appearance="text" />);
      expect(screen.getByRole("radio", { name: "c" })).toHaveAttribute("data-appearance", "text");
      // The letter is for the eye: the swatch is still named by its colour, not "A".
      expect(screen.getByRole("radio", { name: "c" })).toBeInTheDocument();
    });
  });

  describe("keys", () => {
    it("is one stop in the tab order: the chosen swatch, else the first", () => {
      const { rerender } = grid();
      expect(screen.getAllByRole("radio").filter((r) => r.tabIndex === 0).map((r) => r.getAttribute("aria-label"))).toEqual(["White"]);
      rerender(<SwatchGrid aria-label="Colour" groups={rows} value="e" />);
      expect(screen.getAllByRole("radio").filter((r) => r.tabIndex === 0).map((r) => r.getAttribute("aria-label"))).toEqual(["e"]);
    });

    it("moves along a row with the arrow keys, and to the ends with Home and End", async () => {
      grid();
      screen.getByRole("radio", { name: "White" }).focus();
      await userEvent.keyboard("{ArrowRight}");
      expect(screen.getByRole("radio", { name: "b" })).toHaveFocus();
      await userEvent.keyboard("{End}");
      expect(screen.getByRole("radio", { name: "f" })).toHaveFocus();
      await userEvent.keyboard("{Home}");
      expect(screen.getByRole("radio", { name: "White" })).toHaveFocus();
    });

    it("chooses with Space or Enter, as a button does", async () => {
      const onValueChange = vi.fn();
      grid({ onValueChange });
      screen.getByRole("radio", { name: "c" }).focus();
      await userEvent.keyboard("{Enter}");
      await userEvent.keyboard(" ");
      expect(onValueChange).toHaveBeenCalledTimes(2);
    });

    it("lets a caller's own key handler go first", async () => {
      const onKeyDown = vi.fn();
      grid({ onKeyDown });
      screen.getByRole("radio", { name: "White" }).focus();
      await userEvent.keyboard("{ArrowRight}");
      expect(onKeyDown).toHaveBeenCalled();
    });
  });

  it("has no axe violations", async () => {
    const { container } = grid({ value: "b", appearance: "text" });
    await expectNoAxeViolations(container);
  });

  it("reads only --cube-* variables that exist in the built theme.css, in both modes", () => {
    const read = cubeVariablesRead(readSource("src/components/core/ColorPicker/SwatchGrid.module.css"));
    expect(read.length).toBeGreaterThan(0);
    for (const variable of read) {
      expect(themeVariables().light.has(variable), `${variable} (light)`).toBe(true);
      expect(themeVariables().dark.has(variable), `${variable} (dark)`).toBe(true);
    }
  });
});
