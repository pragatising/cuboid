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
 * Fails with the violations listed if axe finds any in `container`. The
 * colour-contrast rule is off: jsdom has no layout/paint, so axe cannot compute
 * it. Contrast is covered by the token tests in packages/primitives.
 */
export async function expectNoAxeViolations(container: HTMLElement) {
  const { violations } = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
  expect(violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
}
