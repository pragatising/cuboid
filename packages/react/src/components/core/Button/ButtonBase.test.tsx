import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { setMode } from "../../../mode";
import { behavesAsComponent, expectNoAxeViolations, renderInMode } from "../../../test/testing";
import { ButtonBase } from "./ButtonBase";
import classes from "./ButtonBase.module.css";
import type { Size, VariantType } from "./types";

const t = tokens.light;
const el = () => screen.getByTestId("base");
const STATES = ["rest", "hover", "pressed", "disabled"] as const;
const SIZES = ["xs", "sm", "md", "lg"] as const satisfies readonly Size[];
const LABEL_VARIANTS = ["primary", "secondary", "ghost", "danger", "rounded"] as const satisfies readonly VariantType[];
// jsdom re-serialises a `font` shorthand (spaces around "/", double quotes), so compare normalised.
const normaliseFont = (font: string) => font.replace(/\s*\/\s*/g, "/").replace(/"/g, "'");
const vars = (variant: Record<string, Record<string, string>> & { bgColor: Record<string, string> }) => ({
  bg: variant.bgColor,
  fg: variant.fgColor,
  border: variant.borderColor,
});

behavesAsComponent({ Component: ButtonBase, dataComponent: "ButtonBase", baseClassName: classes.ButtonBase, props: { children: "Save" } });

describe("ButtonBase: element", () => {
  it("is a button that does not submit forms unless asked", () => {
    const { rerender } = render(<ButtonBase data-testid="base">Save</ButtonBase>);
    expect(el()).toHaveAttribute("type", "button");
    rerender(<ButtonBase data-testid="base" type="submit">Save</ButtonBase>);
    expect(el()).toHaveAttribute("type", "submit");
  });

  it("can render as another element (e.g. a link), without a button `type`", () => {
    render(<ButtonBase as="a" href="/x" data-testid="base">Go</ButtonBase>);
    expect(el().tagName).toBe("A");
    expect(el()).toHaveAttribute("href", "/x");
    expect(el()).not.toHaveAttribute("type");
  });
});

const part = (name: string) => el().querySelector(`[data-component="${name}"]`);

describe("ButtonBase: anatomy (every part is named)", () => {
  it("labelled button: buttonContent holds leadingVisual, text and trailingVisual in that order, visuals hidden from assistive technology", () => {
    render(
      <ButtonBase data-testid="base" leadingVisual={<svg data-testid="lead" />} trailingVisual={<svg data-testid="trail" />}>
        Save
      </ButtonBase>,
    );
    const content = part("buttonContent") as HTMLElement;
    expect(Array.from(content.children).map((c) => c.getAttribute("data-component"))).toEqual(["leadingVisual", "text", "trailingVisual"]);
    expect(part("leadingVisual")).toContainElement(screen.getByTestId("lead"));
    expect(part("leadingVisual")).toHaveAttribute("aria-hidden", "true");
    expect(part("text")).toHaveTextContent("Save");
    expect(part("trailingVisual")).toContainElement(screen.getByTestId("trail"));
    expect(part("trailingVisual")).toHaveAttribute("aria-hidden", "true");
    expect(el()).toHaveAccessibleName("Save");
  });

  it("renders no part for slots that are empty", () => {
    render(<ButtonBase data-testid="base">Save</ButtonBase>);
    expect(part("buttonContent")).toBeInTheDocument();
    expect(part("text")).toBeInTheDocument();
    expect(part("leadingVisual")).toBeNull();
    expect(part("trailingVisual")).toBeNull();
  });


  it("block is a root attribute; alignContent lives on buttonContent, which is what it aligns", () => {
    const { rerender } = render(<ButtonBase data-testid="base">Save</ButtonBase>);
    expect(el()).not.toHaveAttribute("data-block");
    expect(part("buttonContent")).not.toHaveAttribute("data-align");
    rerender(<ButtonBase data-testid="base" block alignContent="start">Save</ButtonBase>);
    expect(el()).toHaveAttribute("data-block");
    expect(part("buttonContent")).toHaveAttribute("data-align", "start");
  });
});

describe("ButtonBase: size controls padding, font, icon size, visual size and radius", () => {
  it.each(SIZES)("labelled button, size %s", (size) => {
    render(<ButtonBase data-testid="base" size={size}>Save</ButtonBase>);
    const c = t.size.control[size];
    // Inline style, not computed style: jsdom would normalise the rem tokens to px.
    expect(el().style.height).toBe(c.size);
    expect(el().style.getPropertyValue("--button-gap")).toBe(c.gap);
    expect(el().style.paddingBlock).toBe(c.paddingBlock);
    expect(el().style.paddingInline).toBe(t.button.paddingInline[size]);
    expect(el().style.borderRadius).toBe(c.borderRadius);
    expect(el().style.getPropertyValue("--button-icon-size")).toBe(c.icon);
    expect(normaliseFont(el().style.font)).toBe(normaliseFont(t.button.font[size]));
  });


  it("defaults to sm", () => {
    render(<ButtonBase data-testid="base">Save</ButtonBase>);
    expect(el()).toHaveAttribute("data-size", "sm");
  });

  it("the rounded variant is a pill", () => {
    render(<ButtonBase data-testid="base" variant="rounded">Save</ButtonBase>);
    expect(el().style.borderRadius).toBe(t.borderRadius.full);
  });
});

describe("ButtonBase: variant picks the colours, from the group the anatomy decides", () => {
  const expectVars = (look: ReturnType<typeof vars>) => {
    for (const [short, group] of Object.entries(look)) {
      for (const state of STATES) expect(el().style.getPropertyValue(`--button-${short}-${state}`), `${short} ${state}`).toBe(group[state]);
    }
  };

  it.each(LABEL_VARIANTS)("labelled button, %s: state colours from tokens.button", (variant) => {
    render(<ButtonBase data-testid="base" variant={variant}>Save</ButtonBase>);
    expectVars(vars(t.button[variant]));
    expect(el()).toHaveAttribute("data-variant", variant);
  });

  it("labelled button defaults to secondary", () => {
    render(<ButtonBase data-testid="base">Save</ButtonBase>);
    expectVars(vars(t.button.secondary));
  });



  it("sets the focus ring, border width and a transition from tokens", () => {
    render(<ButtonBase data-testid="base">Save</ButtonBase>);
    expect(el().style.getPropertyValue("--button-focus-color")).toBe(t.focusRing.color);
    expect(el().style.getPropertyValue("--button-focus-width")).toBe(t.focusRing.width);
    expect(el().style.getPropertyValue("--button-focus-offset")).toBe(t.focusRing.offset);
    expect(el().style.borderWidth).toBe(t.borderWidth.thin);
    expect(el().style.transition).toContain("background-color");
  });
});

describe("ButtonBase: states", () => {
  it("disabled is native: no clicks", async () => {
    const onClick = vi.fn();
    render(<ButtonBase data-testid="base" disabled onClick={onClick}>Save</ButtonBase>);
    await userEvent.click(el());
    expect(el()).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it("inactive looks disabled, stays focusable, and ignores clicks and keyboard activation", async () => {
    const onClick = vi.fn();
    render(<ButtonBase data-testid="base" inactive onClick={onClick}>Save</ButtonBase>);
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
    render(<ButtonBase data-testid="base" aria-disabled="true" onClick={onClick}>Save</ButtonBase>);
    expect(el()).toHaveAttribute("data-inactive");
    await userEvent.click(el());
    expect(onClick).not.toHaveBeenCalled();
  });

  it("calls onClick normally otherwise, and keeps working by keyboard", async () => {
    const onClick = vi.fn();
    render(<ButtonBase data-testid="base" onClick={onClick}>Save</ButtonBase>);
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    await userEvent.click(el());
    expect(onClick).toHaveBeenCalledTimes(2);
  });
});

describe("ButtonBase: loading", () => {
  afterEach(() => vi.useRealTimers());

  it("shows a spinner in place of the leading visual, keeps the label, and ignores activation while staying focusable", async () => {
    const onClick = vi.fn();
    render(
      <ButtonBase data-testid="base" loading leadingVisual={<svg data-testid="lead" />} onClick={onClick}>
        Save
      </ButtonBase>,
    );
    expect(screen.queryByTestId("lead")).not.toBeInTheDocument();
    expect(part("leadingVisual")?.querySelector('[data-component="loadingSpinner"]')).toBeInTheDocument();
    expect(el()).toHaveTextContent("Save");
    expect(el()).toHaveAttribute("data-loading");
    expect(el()).toHaveAttribute("aria-disabled", "true");
    expect(el()).not.toBeDisabled();
    // A busy button still looks like itself: only an inactive one gets the disabled look.
    expect(el()).not.toHaveAttribute("data-inactive");
    await userEvent.tab();
    expect(el()).toHaveFocus();
    await userEvent.click(el());
    expect(onClick).not.toHaveBeenCalled();
  });

  it("puts the spinner beside the label when there are no visuals, and in the trailing slot when that is the only visual", () => {
    const { rerender } = render(<ButtonBase data-testid="base" loading>Save</ButtonBase>);
    expect(part("leadingVisual")?.querySelector('[data-component="loadingSpinner"]')).toBeInTheDocument();
    rerender(<ButtonBase data-testid="base" loading trailingVisual={<svg data-testid="trail" />}>Save</ButtonBase>);
    expect(screen.queryByTestId("trail")).not.toBeInTheDocument();
    expect(part("leadingVisual")).toBeNull();
    expect(part("trailingVisual")?.querySelector('[data-component="loadingSpinner"]')).toBeInTheDocument();
    expect(part("text")).toHaveTextContent("Save");
  });


  it("announces loadingMessage to screen readers through a polite live region when loading starts", () => {
    vi.useFakeTimers();
    const region = () => document.querySelector('[data-component="LiveRegion"]');
    const { rerender } = render(<ButtonBase data-testid="base" loadingMessage="Saving your changes">Save</ButtonBase>);
    act(() => vi.advanceTimersByTime(200));
    expect(region()?.textContent ?? "").not.toBe("Saving your changes");

    rerender(<ButtonBase data-testid="base" loading loadingMessage="Saving your changes">Save</ButtonBase>);
    act(() => vi.advanceTimersByTime(200));
    expect(region()).toHaveAttribute("role", "status");
    expect(region()).toHaveAttribute("aria-live", "polite");
    expect(region()).toHaveTextContent("Saving your changes");
  });

  it('announces "Loading" by default', () => {
    vi.useFakeTimers();
    render(<ButtonBase data-testid="base" loading>Save</ButtonBase>);
    act(() => vi.advanceTimersByTime(200));
    expect(document.querySelector('[data-component="LiveRegion"]')).toHaveTextContent("Loading");
  });
});

describe("ButtonBase: development warnings", () => {
  const warn = () => vi.spyOn(console, "warn").mockImplementation(() => {});

  it("warns when it renders something that is not a semantic button or link", () => {
    const spy = warn();
    render(<ButtonBase as="div">Save</ButtonBase>);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("semantic <button> or <a>"));
    spy.mockRestore();
  });


  it("is silent for a button and a link", () => {
    const spy = warn();
    render(
      <>
        <ButtonBase>Save</ButtonBase>
        <ButtonBase as="a" href="/x">Go</ButtonBase>
      </>,
    );
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("ButtonBase: overrides and modes", () => {
  it("lets the consumer's style override anything it sets, including the colour variables", () => {
    render(<ButtonBase data-testid="base" style={{ height: "99px", "--button-bg-rest": "red" } as React.CSSProperties}>Save</ButtonBase>);
    expect(el().style.height).toBe("99px");
    expect(el().style.getPropertyValue("--button-bg-rest")).toBe("red");
  });

  it("uses the dark tokens in dark mode, and follows a mode change while mounted", () => {
    renderInMode(<ButtonBase data-testid="base" variant="primary">Save</ButtonBase>, "dark");
    expect(el().style.getPropertyValue("--button-bg-rest")).toBe(tokens.dark.button.primary.bgColor.rest);
    expect(el().style.getPropertyValue("--button-focus-color")).toBe(tokens.dark.focusRing.color);
    expect(tokens.dark.button.primary.bgColor.rest).not.toBe(tokens.light.button.primary.bgColor.rest);
    act(() => setMode("light"));
    expect(el().style.getPropertyValue("--button-bg-rest")).toBe(tokens.light.button.primary.bgColor.rest);
  });
});

describe("ButtonBase: accessibility", () => {
  it.each(LABEL_VARIANTS)("labelled button has no axe violations (%s)", async (variant) => {
    const { container } = render(<ButtonBase variant={variant} leadingVisual={<svg />}>Save</ButtonBase>);
    await expectNoAxeViolations(container);
  });

  it("loading and inactive forms have no axe violations", async () => {
    const { container } = render(
      <>
        <ButtonBase loading>Saving</ButtonBase>
        <ButtonBase inactive>Inactive</ButtonBase>
      </>,
    );
    await expectNoAxeViolations(container);
  });
});
