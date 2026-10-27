import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { expectNoAxeViolations } from "../../../test/testing";
import { cubeVariablesRead, readSource, resolveVariable, themeVariables } from "../../../test/themeCss";
import { Switch } from "./Switch";

const control = () => screen.getByRole("switch");

describe("Switch: element", () => {
  it("is a switch named by its label", () => {
    render(<Switch label="Show structure" />);
    expect(screen.getByRole("switch", { name: "Show structure" })).toBeInTheDocument();
    expect(control()).toHaveAttribute("type", "checkbox");
  });

  it("is named by an aria-label when there is no visible label", () => {
    render(<Switch aria-label="Dark mode" />);
    expect(screen.getByRole("switch", { name: "Dark mode" })).toBeInTheDocument();
  });

  it("names its parts, and puts the control inside the labelling element", () => {
    const { container } = render(<Switch label="A" />);
    const root = container.querySelector('[data-component="Switch"]') as HTMLElement;
    expect(root.tagName).toBe("LABEL");
    expect(root.querySelector('[data-component="Switch.Label"]')).toHaveTextContent("A");
    expect(root).toContainElement(control());
    expect(control()).toHaveAttribute("data-component", "Switch.Control");
  });

  it("renders no label part without a label", () => {
    const { container } = render(<Switch aria-label="A" />);
    expect(container.querySelector('[data-component="Switch.Label"]')).toBeNull();
  });
});

describe("Switch: state", () => {
  it("starts off, and turns on and off with a click", async () => {
    render(<Switch label="A" />);
    expect(control()).not.toBeChecked();
    await userEvent.click(control());
    expect(control()).toBeChecked();
    await userEvent.click(control());
    expect(control()).not.toBeChecked();
  });

  it("turns on and off with Space, and a click on the label turns it too", async () => {
    render(<Switch label="A" />);
    await userEvent.tab();
    expect(control()).toHaveFocus();
    await userEvent.keyboard(" ");
    expect(control()).toBeChecked();
    await userEvent.click(screen.getByText("A"));
    expect(control()).not.toBeChecked();
  });

  it("starts on with defaultChecked", () => {
    render(<Switch label="A" defaultChecked />);
    expect(control()).toBeChecked();
  });

  it("calls onCheckedChange with the new state", async () => {
    const onCheckedChange = vi.fn();
    render(<Switch label="A" onCheckedChange={onCheckedChange} />);
    await userEvent.click(control());
    await userEvent.click(control());
    expect(onCheckedChange.mock.calls).toEqual([[true], [false]]);
  });

  it("also calls a native onChange", async () => {
    const onChange = vi.fn();
    render(<Switch label="A" onChange={onChange} />);
    await userEvent.click(control());
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("follows `checked` when controlled, and only asks to change", async () => {
    const onCheckedChange = vi.fn();
    const { rerender } = render(<Switch label="A" checked={false} onCheckedChange={onCheckedChange} />);
    await userEvent.click(control());
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(control()).not.toBeChecked();
    rerender(<Switch label="A" checked onCheckedChange={onCheckedChange} />);
    expect(control()).toBeChecked();
  });

  it("does not turn when disabled", async () => {
    const onCheckedChange = vi.fn();
    render(<Switch label="A" disabled onCheckedChange={onCheckedChange} />);
    await userEvent.click(control());
    expect(control()).toBeDisabled();
    expect(control()).not.toBeChecked();
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("stays focusable but does not turn when read-only", async () => {
    const onCheckedChange = vi.fn();
    render(<Switch label="A" readOnly defaultChecked onCheckedChange={onCheckedChange} />);
    await userEvent.tab();
    expect(control()).toHaveFocus();
    expect(control()).toHaveAttribute("aria-readonly", "true");
    await userEvent.click(control());
    await userEvent.keyboard(" ");
    expect(control()).toBeChecked();
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("marks the label part as disabled", () => {
    const { container } = render(<Switch label="A" disabled />);
    expect(container.querySelector('[data-component="Switch"]')).toHaveAttribute("data-disabled");
  });
});

describe("Switch: form control contract (ADR-05)", () => {
  it("puts className, style and other attributes on the control, and wrapperClassName on the wrapper", () => {
    const { container } = render(<Switch label="A" className="on-control" wrapperClassName="on-wrapper" style={{ opacity: 0.5 }} data-extra="y" aria-details="d" />);
    const root = container.querySelector('[data-component="Switch"]') as HTMLElement;
    expect(control()).toHaveClass("on-control");
    expect(control()).toHaveStyle({ opacity: "0.5" });
    expect(control()).toHaveAttribute("data-extra", "y");
    expect(control()).toHaveAttribute("aria-details", "d");
    expect(root).toHaveClass("on-wrapper");
    expect(root).not.toHaveClass("on-control");
    expect(root).not.toHaveAttribute("data-extra");
  });

  it("puts wrapperProps on the wrapper", () => {
    const { container } = render(<Switch label="A" wrapperProps={{ "data-where": "w", title: "t" }} />);
    const root = container.querySelector('[data-component="Switch"]') as HTMLElement;
    expect(root).toHaveAttribute("data-where", "w");
    expect(root).toHaveAttribute("title", "t");
    expect(control()).not.toHaveAttribute("data-where");
  });

  it("forwards ref to the control (React 19: ref is a plain prop)", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Switch label="A" ref={ref} />);
    expect(ref.current).toBe(control());
  });

  it("takes part in a form: its name and value are submitted only while it is on", async () => {
    const { container } = render(
      <form>
        <Switch label="A" name="notify" value="yes" />
      </form>,
    );
    const form = container.querySelector("form") as HTMLFormElement;
    expect(new FormData(form).get("notify")).toBeNull();
    await userEvent.click(control());
    expect(new FormData(form).get("notify")).toBe("yes");
  });
});

describe("Switch: accessibility", () => {
  it("has no axe violations, off, on, disabled", async () => {
    const { container } = render(
      <div>
        <Switch label="Off" />
        <Switch label="On" defaultChecked />
        <Switch label="Disabled" disabled />
      </div>,
    );
    await expectNoAxeViolations(container);
  });
});

describe("Switch: tokens", () => {
  it("reads only --cube-* variables that exist in the built theme.css, in both modes", () => {
    const read = cubeVariablesRead(readSource("src/components/core/Switch/Switch.module.css"));
    expect(read.length).toBeGreaterThan(0);
    for (const variable of read) {
      expect(themeVariables().light.has(variable), `${variable} (light)`).toBe(true);
      expect(themeVariables().dark.has(variable), `${variable} (dark)`).toBe(true);
    }
  });

  it.each(["light", "dark"] as const)("resolves the track and thumb colours to tokens.%s.switch", (mode) => {
    const { switch: tokenSet } = tokens[mode];
    expect(resolveVariable("--cube-switch-track-bgColor-on-rest", mode)).toBe(tokenSet.track.bgColor.on.rest);
    expect(resolveVariable("--cube-switch-track-bgColor-off-disabled", mode)).toBe(tokenSet.track.bgColor.off.disabled);
    expect(resolveVariable("--cube-switch-track-borderColor-off-rest", mode)).toBe(tokenSet.track.borderColor.off.rest);
    expect(resolveVariable("--cube-switch-thumb-bgColor-off-hover", mode)).toBe(tokenSet.thumb.bgColor.off.hover);
    expect(resolveVariable("--cube-switch-thumb-bgColor-on-rest", mode)).toBe(tokenSet.thumb.bgColor.on.rest);
  });

  it("does not inline any colour on the element", () => {
    const { container } = render(<Switch label="A" defaultChecked />);
    expect(container.querySelector("[style]")).toBeNull();
  });

  it("never uses a pseudo-element inside :where(), which would drop the rule", () => {
    const css = readSource("src/components/core/Switch/Switch.module.css");
    expect(css).not.toMatch(/:where\([^)]*::/);
  });
});
