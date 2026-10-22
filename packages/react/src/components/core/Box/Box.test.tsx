import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { setMode } from "../../../mode";
import { behavesAsComponent, expectNoAxeViolations, renderInMode } from "../../../test/testing";
import { Box } from "./Box";
import classes from "./Box.module.css";

behavesAsComponent({ Component: Box, dataComponent: "Box", baseClassName: classes.Box, props: { children: "content" } });

const t = tokens.light;
const box = () => screen.getByTestId("box");

describe("Box", () => {
  it("is a div by default and can render as another element", () => {
    const { rerender } = render(<Box data-testid="box" />);
    expect(box().tagName).toBe("DIV");
    rerender(<Box as="section" data-testid="box" />);
    expect(box().tagName).toBe("SECTION");
  });

  it("is a column flex container by default: no display set inline (the zero-specificity class makes it flex), flex-direction column", () => {
    render(<Box data-testid="box" />);
    expect(box().style.display).toBe("");
    expect(box()).toHaveStyle({ flexDirection: "column" });
    expect(box()).toHaveClass(classes.Box);
  });

  describe("flexbox props use CSS names and values", () => {
    it("sets flex-direction, flex-wrap, align-items, justify-content, flex-grow and flex-shrink", () => {
      render(
        <Box data-testid="box" flexDirection="row" flexWrap="wrap" alignItems="center" justifyContent="space-between" flexGrow={1} flexShrink={0} />,
      );
      expect(box()).toHaveStyle({ flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", flexGrow: "1", flexShrink: "0" });
    });

    it("takes any CSS display value", () => {
      const { rerender } = render(<Box data-testid="box" display="inline-flex" />);
      expect(box()).toHaveStyle({ display: "inline-flex" });
      rerender(<Box data-testid="box" display="grid" />);
      expect(box()).toHaveStyle({ display: "grid" });
    });
  });

  describe("spacing tokens", () => {
    it("gap takes the Nx scale or the semantic ladder", () => {
      const { rerender } = render(<Box data-testid="box" gap="1.5x" />);
      expect(box().style.gap).toBe(t.size["12"]);
      rerender(<Box data-testid="box" gap="sm" />);
      expect(box().style.gap).toBe(t.space.sm);
    });

    it("padding: scalar, per-axis and per-side", () => {
      const { rerender } = render(<Box data-testid="box" padding="2x" />);
      expect(box().style.padding).toBe(t.size["16"]);
      rerender(<Box data-testid="box" padding={{ block: "1x", inline: "md" }} />);
      expect(box().style.paddingBlock).toBe(t.size["8"]);
      expect(box().style.paddingInline).toBe(t.space.md);
      rerender(<Box data-testid="box" padding={{ top: "0.5x", left: "3x" }} />);
      expect(box().style.paddingTop).toBe(t.size["4"]);
      expect(box().style.paddingLeft).toBe(t.size["24"]);
      expect(box().style.paddingRight).toBe("");
    });

    it("0 is 0 for gap, padding and margin", () => {
      render(<Box data-testid="box" gap={0} padding={0} margin={{ block: 0 }} />);
      expect(box().style.gap).toBe("0px");
      expect(box().style.padding).toBe("0px");
      expect(box().style.marginBlock).toBe("0px");
    });

    it("margin works like padding", () => {
      render(<Box data-testid="box" margin={{ block: "xs" }} />);
      expect(box().style.marginBlock).toBe(t.space.xs);
    });

    it("position offsets take spacing tokens or 0", () => {
      render(<Box data-testid="box" position="absolute" top="1x" left={0} inset={{ inline: "2x" }} />);
      expect(box()).toHaveStyle({ position: "absolute" });
      expect(box().style.top).toBe(t.size["8"]);
      expect(box().style.left).toBe("0px");
      expect(box().style.insetInline).toBe(t.size["16"]);
    });
  });

  describe("colour and shape tokens", () => {
    it("backgroundColor, color and borderRadius resolve from tokens", () => {
      render(<Box data-testid="box" backgroundColor="canvas.inset" color="neutral.contrast" borderRadius="md" />);
      expect(box()).toHaveStyle({ backgroundColor: t.bgColor.canvas.inset, color: t.fgColor.neutral.contrast });
      expect(box().style.borderRadius).toBe(t.borderRadius.md);
    });

    it("a borderColor draws a thin solid border in that colour; without one there is no border", () => {
      const { rerender } = render(<Box data-testid="box" />);
      expect(box().style.borderStyle).toBe("");
      rerender(<Box data-testid="box" borderColor="subtle" />);
      expect(box()).toHaveStyle({ borderStyle: "solid", borderColor: t.borderColor.subtle });
      expect(box().style.borderWidth).toBe(t.borderWidth.thin);
    });

    it("zIndex takes a key of tokens.zIndex", () => {
      const key = Object.keys(t.zIndex)[0] as keyof typeof t.zIndex;
      render(<Box data-testid="box" zIndex={key} />);
      expect(box().style.zIndex).toBe(String(t.zIndex[key]));
    });
  });

  it("passes plain CSS props through (width, overflow, cursor, opacity…)", () => {
    render(<Box data-testid="box" width="50%" maxWidth="20rem" overflow="hidden" cursor="pointer" opacity={0.5} whiteSpace="nowrap" />);
    // Inline style, not computed style: jsdom's getComputedStyle does not report every property.
    const { style } = box();
    expect([style.width, style.maxWidth, style.overflow, style.cursor, style.opacity, style.whiteSpace]).toEqual([
      "50%",
      "20rem",
      "hidden",
      "pointer",
      "0.5",
      "nowrap",
    ]);
  });

  it("sets nothing inline for props that were not passed", () => {
    render(<Box data-testid="box" />);
    expect(box().getAttribute("style")).toBe("flex-direction: column;");
  });

  it("lets the consumer's style override anything Box sets", () => {
    render(<Box data-testid="box" flexDirection="row" gap="1x" style={{ flexDirection: "column", gap: "3px" }} />);
    expect(box()).toHaveStyle({ flexDirection: "column", gap: "3px" });
  });

  it("uses the dark tokens in dark mode and follows a mode change while mounted", () => {
    renderInMode(<Box data-testid="box" backgroundColor="canvas.default" />, "dark");
    expect(box()).toHaveStyle({ backgroundColor: tokens.dark.bgColor.canvas.default });
    act(() => setMode("light"));
    expect(box()).toHaveStyle({ backgroundColor: tokens.light.bgColor.canvas.default });
  });

  it("has no axe violations", async () => {
    const { container } = render(<Box>content</Box>);
    await expectNoAxeViolations(container);
  });
});
