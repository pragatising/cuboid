import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { behavesAsComponent, expectNoAxeViolations } from "../../../test/testing";
import { cubeVariablesRead, readSource, resolveVariable, themeVariables } from "../../../test/themeCss";
import { IconButton } from "./IconButton";
import type { IconButtonSize, IconButtonVariant } from "./IconButton";
import classes from "./IconButton.module.css";

const t = tokens.light;
const icon = <svg data-testid="glyph" />;
const el = () => screen.getByTestId("ib");
const part = (name: string) => el().querySelector(`[data-component="${name}"]`);
const SIZES = ["sm", "md", "lg"] as const satisfies readonly IconButtonSize[];
const VARIANTS = ["ghost", "outlined"] as const satisfies readonly IconButtonVariant[];
const STATES = ["rest", "hover", "pressed", "disabled"] as const;

behavesAsComponent({
  Component: IconButton,
  dataComponent: "IconButton",
  baseClassName: classes.IconButton,
  props: { icon, "aria-label": "Close", disableTooltip: true },
});

const ib = (props: Partial<React.ComponentProps<typeof IconButton>> = {}) =>
  render(<IconButton data-testid="ib" icon={icon} aria-label="Close" {...props} />);

describe("IconButton: element and anatomy", () => {
  it("is a button named by aria-label, showing only the icon", () => {
    ib();
    expect(screen.getByRole("button", { name: "Close" })).toContainElement(screen.getByTestId("glyph"));
  });

  it("can be named by aria-labelledby", () => {
    render(
      <>
        <span id="lbl">Settings</span>
        <IconButton icon={icon} aria-labelledby="lbl" />
      </>,
    );
    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument();
  });

  it("hides the icon part from assistive technology", () => {
    ib();
    expect(part("icon")).toHaveAttribute("aria-hidden", "true");
    expect(part("icon")).toContainElement(screen.getByTestId("glyph"));
  });

  it("does not submit forms unless asked", () => {
    const { rerender } = ib();
    expect(el()).toHaveAttribute("type", "button");
    rerender(<IconButton data-testid="ib" icon={icon} aria-label="Go" type="submit" />);
    expect(el()).toHaveAttribute("type", "submit");
  });
});

describe("IconButton: size and look are attributes, and the element carries no inline style", () => {
  it.each(SIZES)("size %s is the data-size attribute", (size) => {
    ib({ size });
    expect(el()).toHaveAttribute("data-size", size);
  });

  it("defaults to sm and outlined", () => {
    ib();
    expect(el()).toHaveAttribute("data-size", "sm");
    expect(el()).toHaveAttribute("data-variant", "outlined");
  });

  it("selected is the data-selected attribute", () => {
    const { rerender } = ib();
    expect(el()).not.toHaveAttribute("data-selected");
    rerender(<IconButton data-testid="ib" icon={icon} aria-label="Close" selected />);
    expect(el()).toHaveAttribute("data-selected");
  });

  it("sets no inline style: colours, geometry and states are in the CSS", () => {
    ib({ variant: "ghost", size: "lg", selected: true });
    expect(el().getAttribute("style")).toBeNull();
  });
});

// jsdom does not evaluate component CSS, so the colours and geometry are checked at their source: the stylesheet only reads
// variables the token build publishes, and the ones it maps resolve (in both modes) to the JavaScript token tree's values.
describe("IconButton.module.css reads the published token variables", () => {
  const css = readSource("src/components/core/IconButton/IconButton.module.css");
  const mapped = (selector: string, property: string) =>
    css.match(new RegExp(`${selector.replace(/[[\]().]/g, "\\$&")}\\) \\{[^}]*${property}: var\\((--cube-[\\w-]+)\\)`))?.[1];

  it("reads only --cube-* variables that exist in the built theme.css, in both modes", () => {
    for (const name of cubeVariablesRead(css)) {
      expect(themeVariables().light.has(name), `${name} (light)`).toBe(true);
      expect(themeVariables().dark.has(name), `${name} (dark)`).toBe(true);
    }
  });

  it.each(["light", "dark"] as const)("each variant's default and selected colours resolve to tokens.%s.iconButton", (mode) => {
    for (const variant of VARIANTS) {
      for (const look of ["default", "selected"] as const) {
        const selector = `.IconButton[data-variant="${variant}"]${look === "selected" ? "[data-selected]" : ":not([data-selected])"}`;
        for (const [short, group] of [["bg", "bgColor"], ["fg", "fgColor"], ["border", "borderColor"]] as const) {
          for (const state of STATES) {
            const name = mapped(selector, `--icon-button-${short}-${state}`);
            expect(name, `${variant} ${look} ${short} ${state} is mapped`).toBeDefined();
            const expected = (tokens[mode].iconButton[variant][look] as Record<string, Record<string, string>>)[group][state];
            expect(resolveVariable(name as string, mode), `${variant} ${look} ${group} ${state}`).toBe(expected);
          }
        }
      }
    }
  });

  it.each(SIZES)("size %s is a square with its icon size and radius from the iconButton tokens", (size) => {
    const c = t.iconButton[size];
    const selector = `.IconButton[data-size="${size}"]`;
    expect(resolveVariable(mapped(selector, "width") as string, "light")).toBe(c.size);
    expect(resolveVariable(mapped(selector, "height") as string, "light")).toBe(c.size);
    expect(resolveVariable(mapped(selector, "border-radius") as string, "light")).toBe(c.borderRadius);
    expect(resolveVariable(mapped(selector, "--icon-button-icon-size") as string, "light")).toBe(c.icon);
  });

  it("takes the focus ring and border width from tokens", () => {
    expect(resolveVariable("--cube-focusRing-color", "light")).toBe(t.focusRing.color);
    expect(resolveVariable("--cube-borderWidth-thin", "light")).toBe(t.borderWidth.thin);
    expect(css).toContain("var(--cube-motion-transition-hover)");
  });
});

describe("IconButton: states", () => {
  it("calls onClick, by pointer and by keyboard", async () => {
    const onClick = vi.fn();
    ib({ onClick });
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    await userEvent.click(el());
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("disabled is native without a tooltip: no clicks, no focus", async () => {
    const onClick = vi.fn();
    ib({ disabled: true, onClick, disableTooltip: true });
    await userEvent.click(el());
    expect(el()).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it("disabled becomes inactive when it has a tooltip, so the tooltip can still be reached", () => {
    ib({ disabled: true });
    expect(el()).not.toBeDisabled();
    expect(el()).toHaveAttribute("aria-disabled", "true");
  });

  it("inactive looks disabled, stays focusable, and ignores clicks and keyboard activation", async () => {
    const onClick = vi.fn();
    ib({ inactive: true, onClick });
    expect(el()).toHaveAttribute("aria-disabled", "true");
    expect(el()).toHaveAttribute("data-inactive");
    expect(el()).not.toBeDisabled();
    await userEvent.tab();
    expect(el()).toHaveFocus();
    await userEvent.click(el());
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    expect(onClick).not.toHaveBeenCalled();
  });

  it("a consumer's own aria-disabled behaves the same as inactive", async () => {
    const onClick = vi.fn();
    ib({ "aria-disabled": "true", onClick });
    expect(el()).toHaveAttribute("data-inactive");
    await userEvent.click(el());
    expect(onClick).not.toHaveBeenCalled();
  });

  it("sets aria-pressed from selected, and not at all when undecided", () => {
    const { rerender } = ib();
    expect(el()).not.toHaveAttribute("aria-pressed");
    rerender(<IconButton data-testid="ib" icon={icon} aria-label="Bold" selected={false} />);
    expect(el()).toHaveAttribute("aria-pressed", "false");
    rerender(<IconButton data-testid="ib" icon={icon} aria-label="Bold" selected />);
    expect(el()).toHaveAttribute("aria-pressed", "true");
    expect(el()).toHaveAttribute("data-selected");
  });
});

describe("IconButton: loading", () => {
  afterEach(() => vi.useRealTimers());

  it("replaces the icon with a spinner, ignores activation, stays focusable and keeps its name", async () => {
    const onClick = vi.fn();
    ib({ loading: true, onClick, "aria-label": "Refresh" });
    expect(screen.queryByTestId("glyph")).not.toBeInTheDocument();
    expect(part("icon")?.querySelector('[data-component="loadingSpinner"]')).toBeInTheDocument();
    expect(el()).toHaveAttribute("data-loading");
    expect(el()).toHaveAttribute("aria-disabled", "true");
    expect(el()).not.toBeDisabled();
    // A busy button still looks like itself: only an inactive one gets the disabled look.
    expect(el()).not.toHaveAttribute("data-inactive");
    expect(el()).toHaveAccessibleName("Refresh");
    await userEvent.tab();
    expect(el()).toHaveFocus();
    await userEvent.click(el());
    expect(onClick).not.toHaveBeenCalled();
  });

  it("announces loadingMessage through a polite live region when loading starts", () => {
    vi.useFakeTimers();
    const region = () => document.querySelector('[data-component="LiveRegion"]');
    const { rerender } = ib({ loadingMessage: "Saving" });
    act(() => vi.advanceTimersByTime(200));
    expect(region()?.textContent ?? "").not.toBe("Saving");
    rerender(<IconButton data-testid="ib" icon={icon} aria-label="Save" loading loadingMessage="Saving" />);
    act(() => vi.advanceTimersByTime(200));
    expect(region()).toHaveAttribute("aria-live", "polite");
    expect(region()).toHaveTextContent("Saving");
  });

  it('announces "Loading" by default', () => {
    vi.useFakeTimers();
    ib({ loading: true });
    act(() => vi.advanceTimersByTime(200));
    expect(document.querySelector('[data-component="LiveRegion"]')).toHaveTextContent("Loading");
  });
});

describe("IconButton: tooltip", () => {
  const tip = () => document.querySelector<HTMLElement>('[data-component="Tooltip"]');

  it("shows its aria-label as a label tooltip, which is the button's name", async () => {
    render(<IconButton icon={icon} aria-label="Settings" />);
    const button = screen.getByRole("button", { name: "Settings" });
    expect(button).not.toHaveAttribute("aria-label");
    await userEvent.hover(button);
    await waitFor(() => expect(tip()).toHaveAttribute("data-open"));
    expect(tip()).toHaveTextContent("Settings");
    expect(button).toHaveAttribute("aria-labelledby", tip()!.querySelector("span")!.id);
  });

  it("with description, keeps the aria-label and describes the button", async () => {
    render(<IconButton icon={icon} aria-label="Settings" description="Open settings" />);
    const button = screen.getByRole("button", { name: "Settings" });
    await userEvent.hover(button);
    await waitFor(() => expect(tip()).toHaveAttribute("data-open"));
    expect(tip()).toHaveTextContent("Open settings");
    expect(button).toHaveAccessibleDescription("Open settings");
  });

  it("shows no tooltip with disableTooltip, and keeps the aria-label", () => {
    render(<IconButton icon={icon} aria-label="Settings" disableTooltip />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Settings");
    expect(tip()).toBeNull();
  });

  it("is suppressed while the button's own menu is open", async () => {
    render(<IconButton icon={icon} aria-label="More" aria-haspopup="menu" aria-expanded />);
    await userEvent.hover(screen.getByRole("button"));
    await new Promise((resolve) => setTimeout(resolve, 120));
    expect(tip()).not.toHaveAttribute("data-open");
  });

  it("keeps a disabled button focusable and hoverable so the tooltip can explain why", async () => {
    const onClick = vi.fn();
    render(<IconButton icon={icon} aria-label="Save" description="Nothing to save" disabled onClick={onClick} />);
    const button = screen.getByRole("button");
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toHaveAttribute("data-inactive");
    await userEvent.hover(button);
    await waitFor(() => expect(tip()).toHaveAttribute("data-open"));
    expect(tip()).toHaveTextContent("Nothing to save");
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("IconButton: development warnings", () => {
  it("warns when there is no accessible name", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    // @ts-expect-error the types forbid this; a JavaScript consumer is what the warning is for
    render(<IconButton icon={icon} />);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("accessible name"));
    spy.mockRestore();
  });

  it("is silent for a named button", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    ib();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("IconButton: overrides and modes", () => {
  it("lets the consumer's style override anything, including the colour variables", () => {
    ib({ style: { height: "99px", "--icon-button-bg-rest": "red" } as React.CSSProperties });
    expect(el().style.height).toBe("99px");
    expect(el().style.getPropertyValue("--icon-button-bg-rest")).toBe("red");
  });
});

describe("IconButton: accessibility", () => {
  it("has no axe violations (plain, selected, loading, inactive, ghost)", async () => {
    const { container } = render(
      <>
        <IconButton icon={icon} aria-label="Close" />
        <IconButton icon={icon} aria-label="Bold" selected />
        <IconButton icon={icon} aria-label="Refresh" loading />
        <IconButton icon={icon} aria-label="Off" inactive />
        <IconButton icon={icon} aria-label="More" variant="ghost" />
      </>,
    );
    await expectNoAxeViolations(container);
  });
});
