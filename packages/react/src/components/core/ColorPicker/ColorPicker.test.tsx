import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../../../test/testing";
import { cubeVariablesRead, readSource, themeVariables } from "../../../test/themeCss";
import { ColorPicker } from "./ColorPicker";
import type { SwatchGroup } from "./ColorPicker";

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

const field = (props: Partial<React.ComponentProps<typeof ColorPicker>> = {}) => render(<ColorPicker aria-label="Text colour" groups={groups} {...props} />);
const open = async () => {
  await userEvent.click(screen.getByRole("button", { name: /Text colour/ }));
  return screen.findByRole("dialog", { name: "Text colour" });
};

describe("ColorPicker: the button", () => {
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

describe("ColorPicker: the panel", () => {
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
    rerender(<ColorPicker aria-label="Text colour" groups={groups} value="indigo.5" onValueChange={onValueChange} />);
    expect(screen.getByRole("button", { name: "Text colour: indigo.5" })).toBeInTheDocument();
  });
});

describe("ColorPicker: labels and looks", () => {
  it("draws the swatches as plain rows, naming each row only to assistive technology", async () => {
    field();
    const panel = await open();
    expect(within(panel).getByRole("radiogroup", { name: "Palette" })).toBeInTheDocument();
    expect(within(panel).queryByText("Palette")).toBeNull();
  });

  it("draws each group's label above its row when asked to", async () => {
    field({ showLabels: true });
    const panel = await open();
    expect(within(panel).getByText("Palette")).toBeInTheDocument();
    expect(within(panel).getByText("Surface")).toBeInTheDocument();
  });

  it("passes how swatches are drawn on to the grid", async () => {
    field({ appearance: "text" });
    const panel = await open();
    expect(within(panel).getAllByRole("radio")[0]).toHaveAttribute("data-appearance", "text");
    expect(within(panel).getAllByRole("radio")[0]).toHaveTextContent("A");
  });
});

describe("ColorPicker: keys", () => {
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

describe("ColorPicker: a long palette, and any colour", () => {
  const long: SwatchGroup[] = [{ label: "Colours", swatches: Array.from({ length: 14 }, (_, i) => ({ value: `hue.${i}`, color: "#000" })) }];

  it("has a search field only when it is asked for, however long the palette", async () => {
    const { unmount } = render(<ColorPicker aria-label="Text colour" groups={long} />);
    await userEvent.click(screen.getByRole("button", { name: /Text colour/ }));
    await screen.findByRole("dialog", { name: "Text colour" });
    expect(screen.queryByRole("textbox")).toBeNull();
    unmount();
    render(<ColorPicker aria-label="Text colour" groups={long} searchable />);
    await userEvent.click(screen.getByRole("button", { name: /Text colour/ }));
    expect(await screen.findByRole("textbox", { name: "Search Text colour" })).toBeInTheDocument();
  });

  it("narrows the swatches to what matches what is typed, and says when none do", async () => {
    render(<ColorPicker aria-label="Text colour" groups={long} searchable />);
    await userEvent.click(screen.getByRole("button", { name: /Text colour/ }));
    const search = await screen.findByRole("textbox", { name: "Search Text colour" });
    await userEvent.type(search, "hue.1");
    expect(screen.getAllByRole("radio").map((r) => r.getAttribute("aria-label"))).toEqual(["hue.1", "hue.10", "hue.11", "hue.12", "hue.13"]);
    await userEvent.clear(search);
    await userEvent.type(search, "zzz");
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
    expect(screen.getByText("No colours match.")).toBeInTheDocument();
  });
});

describe("ColorPicker: a Custom side, for any colour", () => {
  const sides = () => screen.queryByRole("group", { name: "Text colour source" });

  it("has no Tokens / Custom switch unless it is asked for", async () => {
    field();
    await open();
    expect(sides()).toBeNull();
    expect(screen.queryByRole("slider")).toBeNull();
  });

  it("offers the switch, opens on Tokens, and shows a gradient, a hue slider and a hex field on Custom", async () => {
    field({ custom: true });
    await open();
    expect(within(sides()!).getByRole("button", { name: "Tokens" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("radiogroup", { name: "Text" })).toBeInTheDocument();
    await userEvent.click(within(sides()!).getByRole("button", { name: "Custom" }));
    expect(screen.getByRole("slider", { name: "Saturation and brightness" })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Hue" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Hex" })).toBeInTheDocument();
    expect(screen.queryByRole("radiogroup", { name: "Text" })).toBeNull();
  });

  it("opens on Custom when what is chosen is a colour no swatch has", async () => {
    field({ custom: true, defaultValue: "#336699" });
    await open();
    expect(within(sides()!).getByRole("button", { name: "Custom" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("textbox", { name: "Hex" })).toHaveValue("#336699");
  });

  it("reports a hex colour typed, without closing the panel, and shows it on the button", async () => {
    const onValueChange = vi.fn();
    field({ custom: true, onValueChange });
    await open();
    await userEvent.click(within(sides()!).getByRole("button", { name: "Custom" }));
    const hex = screen.getByRole("textbox", { name: "Hex" });
    await userEvent.clear(hex);
    await userEvent.type(hex, "#ff0000");
    expect(onValueChange).toHaveBeenLastCalledWith("#ff0000");
    expect(screen.getByRole("dialog", { name: "Text colour" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Text colour: #ff0000" })).toBeInTheDocument();
  });

  it("says so, and reports nothing, while the hex typed is not a colour", async () => {
    const onValueChange = vi.fn();
    field({ custom: true, defaultValue: "#336699", onValueChange });
    await open();
    const hex = screen.getByRole("textbox", { name: "Hex" });
    await userEvent.clear(hex);
    await userEvent.type(hex, "#12");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(hex).toBeInvalid();
  });

  it("moves saturation and brightness with the arrow keys on the gradient, and the hue with its slider", async () => {
    const onValueChange = vi.fn();
    field({ custom: true, defaultValue: "#ff0000", onValueChange });
    await open();
    const area = screen.getByRole("slider", { name: "Saturation and brightness" });
    expect(area).toHaveAttribute("aria-valuetext", "Saturation 100%, brightness 100%");
    area.focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(area).toHaveAttribute("aria-valuetext", "Saturation 100%, brightness 99%");
    await userEvent.keyboard("{Shift>}{ArrowLeft}{/Shift}");
    expect(area).toHaveAttribute("aria-valuetext", "Saturation 90%, brightness 99%");
    expect(onValueChange).toHaveBeenLastCalledWith(expect.stringMatching(/^#[0-9a-f]{6}$/));
    fireEvent.change(screen.getByRole("slider", { name: "Hue" }), { target: { value: "120" } });
    expect(onValueChange).toHaveBeenLastCalledWith(expect.stringMatching(/^#[0-9a-f]{6}$/));
    expect(onValueChange.mock.lastCall![0]).not.toBe("#ff0000");
  });
});

describe("ColorPicker: a Border switch, for a surface", () => {
  it("is there only when it is given onBorderedChange, and reports the choice without closing the panel", async () => {
    const onBorderedChange = vi.fn();
    const { unmount } = field();
    await open();
    expect(screen.queryByRole("switch", { name: "Border" })).toBeNull();
    unmount();
    field({ bordered: false, onBorderedChange });
    await open();
    const border = screen.getByRole("switch", { name: "Border" });
    expect(border).not.toBeChecked();
    await userEvent.click(border);
    expect(onBorderedChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole("dialog", { name: "Text colour" })).toBeInTheDocument();
  });

  it("shows the border as it is given", async () => {
    field({ bordered: true, onBorderedChange: () => {} });
    await open();
    expect(screen.getByRole("switch", { name: "Border" })).toBeChecked();
  });
});

describe("ColorPicker: width", () => {
  it("lays swatches out a fixed number to a row, 8 by default, so the panel is as wide as that many and no wider", async () => {
    field();
    await open();
    const row = screen.getAllByRole("radiogroup")[0];
    expect(row).toHaveAttribute("data-columns");
    expect(row.style.getPropertyValue("--columns")).toBe("8");
  });

  it("takes another number of columns", async () => {
    field({ columns: 5 });
    await open();
    expect(screen.getAllByRole("radiogroup")[0].style.getPropertyValue("--columns")).toBe("5");
  });
});

describe("ColorPicker: clearing", () => {
  it("offers a no-colour swatch, first in the grid, only when it can be cleared, and reports undefined", async () => {
    const onValueChange = vi.fn();
    field({ defaultValue: "neutral.muted", clearable: true, onValueChange });
    const panel = await open();
    const radios = within(panel).getAllByRole("radio");
    expect(radios[0]).toHaveAccessibleName("None");
    expect(radios[0]).toHaveAttribute("aria-checked", "false");
    // A tile in the grid, not a row of its own: no button called None.
    expect(within(panel).queryByRole("button", { name: "None" })).toBeNull();
    await userEvent.click(radios[0]);
    expect(onValueChange).toHaveBeenCalledWith(undefined);
    expect(screen.getByRole("button", { name: "Text colour: none" })).toBeInTheDocument();
  });

  it("is not there when it cannot be cleared", async () => {
    field();
    expect(within(await open()).queryByRole("radio", { name: "None" })).toBeNull();
  });

  it("is the one chosen while nothing is", async () => {
    field({ clearable: true });
    expect(within(await open()).getByRole("radio", { name: "None" })).toHaveAttribute("aria-checked", "true");
  });

  it("goes while a search is narrowing the swatches, since it is not something that was searched for", async () => {
    render(<ColorPicker aria-label="Text colour" groups={groups} clearable searchable />);
    await userEvent.click(screen.getByRole("button", { name: /Text colour/ }));
    expect(await screen.findByRole("radio", { name: "None" })).toBeInTheDocument();
    await userEvent.type(screen.getByRole("textbox", { name: "Search Text colour" }), "danger");
    expect(screen.queryByRole("radio", { name: "None" })).toBeNull();
  });
});

describe("ColorPicker: accessibility and tokens", () => {
  it("has no axe violations, closed or open", async () => {
    const { container } = field({ defaultValue: "neutral.muted", custom: true });
    await expectNoAxeViolations(container);
    const panel = await open();
    await expectNoAxeViolations(panel);
  });

  it.each(["ColorPicker", "ColorPanel", "ColorSpectrum"])("%s reads only --cube-* variables that exist in the built theme.css, in both modes", (name) => {
    const read = cubeVariablesRead(readSource(`src/components/core/ColorPicker/${name}.module.css`));
    expect(read.length).toBeGreaterThan(0);
    for (const variable of read) {
      expect(themeVariables().light.has(variable), `${variable} (light)`).toBe(true);
      expect(themeVariables().dark.has(variable), `${variable} (dark)`).toBe(true);
    }
  });
});
