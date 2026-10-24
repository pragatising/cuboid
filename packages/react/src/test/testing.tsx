import React from "react";
import axe from "axe-core";
import { act, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { setMode } from "../mode";
import type { ModeName } from "../mode";

/** Render `ui` with the token mode already set (the mode store is global — see src/mode/useTokens.ts). */
export function renderInMode(ui: React.ReactElement, mode: ModeName) {
  act(() => setMode(mode));
  return render(ui);
}

/**
 * The shared conformance checks every component must pass (docs/style.md,
 * "Merge shared props intentionally"). Call inside the component's test file:
 *
 *   behavesAsComponent({ Component: Divider, dataComponent: "Divider", baseClassName: classes.Divider });
 *
 * `props` are the minimum required props for a valid render. The element under
 * test is the component's root, found by `data-component`.
 */
export function behavesAsComponent({
  Component,
  dataComponent,
  baseClassName,
  props = {},
}: {
  Component: React.ElementType;
  dataComponent: string;
  baseClassName?: string;
  props?: Record<string, unknown>;
}) {
  const root = (container: HTMLElement) => container.querySelector(`[data-component="${dataComponent}"]`) as HTMLElement | null;

  describe(`${dataComponent} (shared component contract)`, () => {
    it("renders its root with the data-component attribute", () => {
      const { container } = render(<Component {...props} />);
      expect(root(container)).toBeInTheDocument();
    });

    it("merges the consumer's className with its own", () => {
      const { container } = render(<Component {...props} className="consumer-class" />);
      expect(root(container)).toHaveClass("consumer-class");
      if (baseClassName) expect(root(container)).toHaveClass(baseClassName);
    });

    it("applies the consumer's style on top of its own", () => {
      const { container } = render(<Component {...props} style={{ opacity: 0.5 }} />);
      expect(root(container)).toHaveStyle({ opacity: "0.5" });
    });

    it("forwards ref to the root element (React 19: ref is a plain prop)", () => {
      const ref = React.createRef<HTMLElement>();
      const { container } = render(<Component {...props} ref={ref} />);
      expect(ref.current).toBe(root(container));
    });

    it("passes other attributes (id, data-*, aria-*) through to the root", () => {
      const { container } = render(<Component {...props} id="x" data-extra="y" aria-label="z" />);
      expect(root(container)).toHaveAttribute("id", "x");
      expect(root(container)).toHaveAttribute("data-extra", "y");
      expect(root(container)).toHaveAttribute("aria-label", "z");
    });
  });
}

/**
 * The shared conformance checks for a form control (ADR-05): `InputText`, `TextArea`, `Select`, `Autocomplete`. A form control
 * is like its native element, so what `behavesAsComponent` asserts of the root is asserted of the control here: `className`,
 * `style`, `ref`, `id`, `data-*` and `aria-*` go to the control, and only `wrapperClassName` / `wrapperProps` reach the outer
 * wrapper (found by `data-component`). `props` are the minimum for a valid render; the label is given here.
 */
export function behavesAsFormControl({
  Component,
  dataComponent,
  props = {},
  control = 'input:not([type="hidden"]), textarea, button[role="combobox"]',
}: {
  Component: React.ElementType;
  dataComponent: string;
  props?: Record<string, unknown>;
  /** CSS selector of the native control that takes the props. */
  control?: string;
}) {
  const parts = (container: HTMLElement) => ({
    root: container.querySelector(`[data-component="${dataComponent}"]`) as HTMLElement,
    control: container.querySelector(control) as HTMLElement,
  });

  describe(`${dataComponent} (shared form-control contract)`, () => {
    it("renders a wrapper with the data-component attribute around one control", () => {
      const { container } = render(<Component label="Label" {...props} />);
      const { root, control: field } = parts(container);
      expect(root).toBeInTheDocument();
      expect(field).toBeInTheDocument();
      expect(root).toContainElement(field);
    });

    it("puts className and style on the control, and wrapperClassName on the wrapper", () => {
      const { container } = render(<Component label="Label" {...props} className="on-control" wrapperClassName="on-wrapper" style={{ opacity: 0.5 }} />);
      const { root, control: field } = parts(container);
      expect(field).toHaveClass("on-control");
      expect(field).toHaveStyle({ opacity: "0.5" });
      expect(root).toHaveClass("on-wrapper");
      expect(root).not.toHaveClass("on-control");
    });

    it("forwards ref to the control (React 19: ref is a plain prop)", () => {
      const ref = React.createRef<HTMLElement>();
      const { container } = render(<Component label="Label" {...props} ref={ref} />);
      expect(ref.current).toBe(parts(container).control);
    });

    it("takes the consumer's id on the control, and the label points at it", () => {
      const { container } = render(<Component label="Label" {...props} id="mine" />);
      const { control: field } = parts(container);
      expect(field).toHaveAttribute("id", "mine");
      expect(container.querySelector("label")).toHaveAttribute("for", "mine");
    });

    it("passes other attributes (data-*, aria-*) to the control, not the wrapper", () => {
      const { container } = render(<Component label="Label" {...props} data-extra="y" aria-details="d" />);
      const { root, control: field } = parts(container);
      expect(field).toHaveAttribute("data-extra", "y");
      expect(field).toHaveAttribute("aria-details", "d");
      expect(root).not.toHaveAttribute("data-extra");
    });

    it("names the help text and the error on the control, and marks it invalid only with an error", () => {
      const { container, rerender } = render(<Component label="Label" {...props} description="Help" />);
      expect(parts(container).control).not.toHaveAttribute("aria-invalid");
      expect(parts(container).control).toHaveAccessibleDescription("Help");
      rerender(<Component label="Label" {...props} description="Help" error="Required" />);
      expect(parts(container).control).toHaveAttribute("aria-invalid", "true");
      expect(parts(container).control).toHaveAccessibleDescription("Help Required");
    });
  });
}

/**
 * Fails with the violations listed if axe finds any in `container`. The
 * colour-contrast rule is off: jsdom has no layout/paint, so axe cannot compute
 * it. Contrast is covered by the token tests in packages/primitives.
 */
export async function expectNoAxeViolations(container: HTMLElement) {
  const { violations } = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
  expect(violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
}
