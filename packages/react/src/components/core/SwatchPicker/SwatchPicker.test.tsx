import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../../../test/testing";
import { cubeVariablesRead, readSource, themeVariables } from "../../../test/themeCss";
import { SwatchPicker } from "./SwatchPicker";
import type { SwatchGroup } from "./SwatchPicker";

const groups: SwatchGroup[] = [
  {
    label: "Text",
    swatches: [
      { value: "neutral.default", color: "#525252" },
      { value: "neutral.muted", color: "#6f6f6d" },
      { value: "danger.default", color: "#c4372d", label: "Danger" },
    ],
  },
  { label: "Palette", swatches: [{ value: "indigo.5", color: "#5b6dd6" }, { value: "green.5", color: "#3d9a5f" }] },
  { label: "Surface", swatches: [{ value: "canvas.default", color: "#ffffff" }] },
];

const field = (props: Partial<React.ComponentProps<typeof SwatchPicker>> = {}) => render(<SwatchPicker aria-label="Text colour" groups={groups} {...props} />);
const open = async () => {
  await userEvent.click(screen.getByRole("button", { name: /Text colour/ }));
  return screen.findByRole("dialog", { name: "Text colour" });
};

describe("SwatchPicker: the button", () => {
  it("says nothing is chosen, and offers the panel without showing it", () => {
    field();
    expect(screen.getByRole("button", { name: "Text colour: none" })).toHaveTextContent("Choose a colour");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows the value chosen", () => {
    field({ defaultValue: "neutral.muted" });
    expect(screen.getByRole("button", { name: "Text colour: neutral.muted" })).toHaveTextContent("neutral.muted");
  });

  it("can say something else while nothing is chosen", () => {
    field({ placeholder: "Pick" });
    expect(screen.getByRole("button")).toHaveTextContent("Pick");
  });
});

describe("SwatchPicker: the panel", () => {
  it("opens as a named dialog, with a radio group of swatches for each group", async () => {
    field();
    const panel = await open();
    expect(within(panel).getByRole("radiogroup", { name: "Text" })).toBeInTheDocument();
    expect(within(panel).getByRole("radiogroup", { name: "Palette" })).toBeInTheDocument();
    expect(within(panel).getAllByRole("radio")).toHaveLength(6);
  });

  it("names a swatch by its label, or its value when it has none", async () => {
    field();
    const panel = await open();
    expect(within(panel).getByRole("radio", { name: "Danger" })).toBeInTheDocument();
    expect(within(panel).getByRole("radio", { name: "indigo.5" })).toBeInTheDocument();
  });

  it("draws each swatch in the colour it is given, through one variable, not an inline colour", async () => {
    field();
    const panel = await open();
    const swatch = within(panel).getByRole("radio", { name: "indigo.5" });
    expect(swatch.style.getPropertyValue("--swatch")).toBe("#5b6dd6");
    expect(swatch.style.background).toBe("");
    expect(swatch.style.backgroundColor).toBe("");
  });

  it("outlines only a swatch that would be lost on the page: white, not a dark or a saturated colour", async () => {
    field();
    const panel = await open();
    expect(within(panel).getByRole("radio", { name: "canvas.default" })).toHaveAttribute("data-outline");
    expect(within(panel).getByRole("radio", { name: "indigo.5" })).not.toHaveAttribute("data-outline");
    expect(within(panel).getByRole("radio", { name: "neutral.default" })).not.toHaveAttribute("data-outline");
  });

  it("marks the one chosen", async () => {
    field({ defaultValue: "green.5" });
    const panel = await open();
    expect(within(panel).getByRole("radio", { name: "green.5" })).toHaveAttribute("aria-checked", "true");
    expect(within(panel).getByRole("radio", { name: "indigo.5" })).toHaveAttribute("aria-checked", "false");
  });

  it("choosing reports the value, closes the panel, and shows it on the button", async () => {
    const onValueChange = vi.fn();
    field({ onValueChange });
    const panel = await open();
    await userEvent.click(within(panel).getByRole("radio", { name: "Danger" }));
    expect(onValueChange).toHaveBeenCalledWith("danger.default");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: "Text colour: danger.default" })).toBeInTheDocument();
  });

  it("is controlled when given a value: it shows that, and changes only when told to", async () => {
    const onValueChange = vi.fn();
    const { rerender } = field({ value: "neutral.default", onValueChange });
    const panel = await open();
    await userEvent.click(within(panel).getByRole("radio", { name: "indigo.5" }));
    expect(onValueChange).toHaveBeenCalledWith("indigo.5");
    expect(screen.getByRole("button", { name: "Text colour: neutral.default" })).toBeInTheDocument();
    rerender(<SwatchPicker aria-label="Text colour" groups={groups} value="indigo.5" onValueChange={onValueChange} />);
    expect(screen.getByRole("button", { name: "Text colour: indigo.5" })).toBeInTheDocument();
  });
});

describe("SwatchPicker: keys", () => {
  it("has one stop in the tab order: the chosen swatch, else the first", async () => {
    field({ defaultValue: "indigo.5" });
    const panel = await open();
    const stops = within(panel).getAllByRole("radio").filter((radio) => radio.tabIndex === 0);
    expect(stops.map((radio) => radio.getAttribute("aria-label"))).toEqual(["indigo.5"]);
  });

  it("moves between swatches with the arrow keys, Home and End", async () => {
    field();
    const panel = await open();
    const radios = within(panel).getAllByRole("radio");
    radios[0].focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(radios[1]).toHaveFocus();
    await userEvent.keyboard("{End}");
    expect(radios[5]).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(radios[4]).toHaveFocus();
    await userEvent.keyboard("{Home}");
    expect(radios[0]).toHaveFocus();
  });

  it("chooses with Enter or Space, as a button does", async () => {
    const onValueChange = vi.fn();
    field({ onValueChange });
    const panel = await open();
    within(panel).getAllByRole("radio")[1].focus();
    await userEvent.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenCalledWith("neutral.muted");
  });

  it("closes with Escape and gives focus back to the button", async () => {
    field();
    await open();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: /Text colour/ })).toHaveFocus();
  });
});

describe("SwatchPicker: a long palette, and any colour", () => {
  const long: SwatchGroup[] = [{ label: "Colours", swatches: Array.from({ length: 14 }, (_, i) => ({ value: `hue.${i}`, color: "#000" })) }];

  it("has no search field while it is short, and one when it is long", async () => {
    const { unmount } = field();
    await open();
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();
    unmount();
    render(<SwatchPicker aria-label="Text colour" groups={long} />);
    await userEvent.click(screen.getByRole("button", { name: /Text colour/ }));
    expect(await screen.findByRole("textbox", { name: "Search Text colour" })).toBeInTheDocument();
  });

  it("narrows the swatches to what matches what is typed, and says when none do", async () => {
    render(<SwatchPicker aria-label="Text colour" groups={long} />);
    await userEvent.click(screen.getByRole("button", { name: /Text colour/ }));
    const search = await screen.findByRole("textbox", { name: "Search Text colour" });
    await userEvent.type(search, "hue.1");
    expect(screen.getAllByRole("radio").map((r) => r.getAttribute("aria-label"))).toEqual(["hue.1", "hue.10", "hue.11", "hue.12", "hue.13"]);
    await userEvent.clear(search);
    await userEvent.type(search, "zzz");
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
    expect(screen.getByText("No colours match.")).toBeInTheDocument();
  });

  it("takes any CSS colour typed in, when it is allowed to, and not otherwise", async () => {
    const onValueChange = vi.fn();
    field({ allowCustom: true, onValueChange });
    await open();
    const search = screen.getByRole("textbox", { name: "Search Text colour" });
    await userEvent.type(search, "not a colour");
    expect(screen.queryByRole("button", { name: /^Use / })).toBeNull();
    await userEvent.clear(search);
    await userEvent.type(search, "#ff0000");
    await userEvent.click(screen.getByRole("button", { name: "Use #ff0000" }));
    expect(onValueChange).toHaveBeenCalledWith("#ff0000");
    expect(screen.getByRole("button", { name: "Text colour: #ff0000" })).toBeInTheDocument();
  });

  it("does not offer a colour typed in when it is not allowed", async () => {
    render(<SwatchPicker aria-label="Text colour" groups={long} />);
    await userEvent.click(screen.getByRole("button", { name: /Text colour/ }));
    await userEvent.type(await screen.findByRole("textbox", { name: "Search Text colour" }), "#ff0000");
    expect(screen.queryByRole("button", { name: /^Use / })).toBeNull();
  });
});

describe("SwatchPicker: clearing", () => {
  it("offers None only when it can be cleared, and reports undefined", async () => {
    const onValueChange = vi.fn();
    const { unmount } = field({ defaultValue: "neutral.muted" });
    await open();
    expect(screen.queryByRole("button", { name: "None" })).toBeNull();
    unmount();
    field({ defaultValue: "neutral.muted", clearable: true, onValueChange });
    await open();
    await userEvent.click(screen.getByRole("button", { name: "None" }));
    expect(onValueChange).toHaveBeenCalledWith(undefined);
    expect(screen.getByRole("button", { name: "Text colour: none" })).toBeInTheDocument();
  });
});

describe("SwatchPicker: accessibility and tokens", () => {
  it("has no axe violations, closed or open", async () => {
    const { container } = field({ defaultValue: "neutral.muted", allowCustom: true });
    await expectNoAxeViolations(container);
    const panel = await open();
    await expectNoAxeViolations(panel);
  });

  it("reads only --cube-* variables that exist in the built theme.css, in both modes", () => {
    const read = cubeVariablesRead(readSource("src/components/core/SwatchPicker/SwatchPicker.module.css"));
    expect(read.length).toBeGreaterThan(0);
    for (const variable of read) {
      expect(themeVariables().light.has(variable), `${variable} (light)`).toBe(true);
      expect(themeVariables().dark.has(variable), `${variable} (dark)`).toBe(true);
    }
  });
});
