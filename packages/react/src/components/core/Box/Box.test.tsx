import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { setMode } from "../../../mode";
import { behavesAsComponent, expectNoAxeViolations, renderInMode } from "../../../test/testing";
import { Box } from "./Box";
import classes from "./Box.module.css";

behavesAsComponent({ Component: Box, dataComponent: "Box", baseClassName: classes.Box, props: { children: "content" } });

const t = tokens.light;
const box = () => screen.getByTestId("box");

/**
 * The style object Box hands to its element, exactly as a browser receives it. jsdom's CSS parser does not model
 * shorthand/longhand interaction or the `border` shorthand, so those are checked here rather than on the DOM.
 */
function styleOf(ui: (As: React.ElementType) => React.ReactElement): React.CSSProperties {
  let received: React.CSSProperties = {};
  const Probe = (props: { style?: React.CSSProperties }) => {
    received = props.style ?? {};
    return null;
  };
  render(ui(Probe));
  return received;
}

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

    it("padding: the whole set of CSS names (shorthand, axes, sides, logical sides)", () => {
      render(<Box data-testid="box" padding="2x" paddingBlock="1x" paddingInline="md" paddingTop="0.5x" paddingLeft="3x" paddingBlockEnd="xs" paddingInlineEnd="lg" />);
      const { style } = box();
      expect(style.paddingBlock).not.toBe("");
      expect(style.paddingInline).toBe(t.space.md);
      expect(style.paddingTop).toBe(t.size["4"]);
      expect(style.paddingLeft).toBe(t.size["24"]);
      expect(style.paddingBlockEnd).toBe(t.space.xs);
      expect(style.paddingInlineEnd).toBe(t.space.lg);
    });

    it("a side overrides the shorthand whatever order the JSX has: the style is written general to specific", () => {
      const style = styleOf((As) => <Box as={As} paddingTop={0} padding="2x" paddingBlock="1x" />);
      expect(Object.keys(style).filter((k) => k.startsWith("padding"))).toEqual(["padding", "paddingBlock", "paddingTop"]);
    });

    it("rowGap and columnGap work like gap", () => {
      render(<Box data-testid="box" gap="1x" rowGap="2x" columnGap="sm" />);
      expect(box().style.rowGap).toBe(t.size["16"]);
      expect(box().style.columnGap).toBe(t.space.sm);
    });

    it("0 is 0 for gap, padding and margin", () => {
      render(<Box data-testid="box" gap={0} padding={0} marginBlock={0} />);
      expect(box().style.gap).toBe("0px");
      expect(box().style.padding).toBe("0px");
      expect(box().style.marginBlock).toBe("0px");
    });

    it("margin has the same set of names, and also takes auto", () => {
      render(<Box data-testid="box" marginBlock="xs" marginInline="auto" marginTop="1x" />);
      expect(box().style.marginBlock).not.toBe("");
      expect(box().style.marginInline).toBe("auto");
      expect(box().style.marginTop).toBe(t.size["8"]);
    });

    it("also takes a raw CSS length: px, rem, em, %, calc(), var()", () => {
      render(<Box data-testid="box" padding="12px" gap="0.75rem" marginTop="-4px" rowGap="calc(100% - 2rem)" paddingBlock="2em" />);
      const { style } = box();
      expect(style.paddingBlock).toBe("2em");
      expect(style.gap).toBe("0.75rem");
      expect(style.marginTop).toBe("-4px");
      expect(style.rowGap).toBe("calc(100% - 2rem)");
    });

    it("throws, naming the value, for a typo that is neither a token nor a CSS length", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      expect(() => render(<Box padding={"huge" as never} />)).toThrow(/Unknown spacing value "huge"/);
      spy.mockRestore();
    });

    it("throws, naming the value, for a spacing value off the scale", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      expect(() => render(<Box padding={"0.3x" as never} />)).toThrow(/Unknown spacing value "0.3x"/);
      spy.mockRestore();
    });

    it("position offsets take spacing tokens or 0", () => {
      render(<Box data-testid="box" position="absolute" top="1x" left={0} insetInline="2x" insetBlockStart="3x" />);
      expect(box()).toHaveStyle({ position: "absolute" });
      expect(box().style.top).toBe(t.size["8"]);
      expect(box().style.left).toBe("0px");
      expect(box().style.insetInline).toBe(t.size["16"]);
      expect(box().style.insetBlockStart).toBe(t.size["24"]);
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

    it("borderRadius takes a named step, a step of the Nx scale, or a raw CSS length", () => {
      const { rerender } = render(<Box data-testid="box" borderRadius="1.5x" />);
      expect(box().style.borderRadius).toBe(t.size["12"]);
      rerender(<Box data-testid="box" borderRadius="3px" />);
      expect(box().style.borderRadius).toBe("3px");
      rerender(<Box data-testid="box" borderRadius="full" />);
      expect(box().style.borderRadius).toBe(t.borderRadius.full);
    });

    it("border takes a tokens.border entry, whole, per axis or per side", () => {
      const style = styleOf((As) => <Box as={As} border="default" borderBottom="strong" borderInlineStart="translucent.2" borderBlock="subtle" />);
      expect(style.border).toBe(t.border.default);
      expect(style.borderBottom).toBe(t.border.strong);
      expect(style.borderInlineStart).toBe(t.border.translucent[2]);
      expect(style.borderBlock).toBe(t.border.subtle);
    });

    it("a border side overrides the whole border: border is written before its axes and sides", () => {
      const style = styleOf((As) => <Box as={As} borderTop="strong" borderBlock="default" border="subtle" />);
      expect(Object.keys(style).filter((k) => k.startsWith("border"))).toEqual(["border", "borderBlock", "borderTop"]);
    });

    it("throws for a border token that does not exist", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      expect(() => render(<Box border={"nope" as never} />)).toThrow(/Unknown border "nope"/);
      spy.mockRestore();
    });

    it("colours take a token path or any CSS colour: keywords, names, hex, functions", () => {
      for (const raw of ["transparent", "currentColor", "red", "#fff", "#e2e1dd80", "rgb(0 0 0 / 50%)", "hsl(200 50% 50%)", "oklch(60% 0.1 200)", "var(--brand)", "color-mix(in srgb, red, blue)"]) {
        const style = styleOf((As) => <Box as={As} backgroundColor={raw as never} color={raw as never} />);
        expect(style.backgroundColor).toBe(raw);
        expect(style.color).toBe(raw);
      }
    });

    it("a token path still wins, and a colour that is neither a token nor CSS throws, naming it", () => {
      const style = styleOf((As) => <Box as={As} backgroundColor="canvas.inset" />);
      expect(style.backgroundColor).toBe(t.bgColor.canvas.inset);
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      expect(() => render(<Box backgroundColor={"canvs.inset" as never} />)).toThrow(/Unknown colour "canvs.inset"/);
      spy.mockRestore();
    });

    it("borderColor takes a raw colour too, and still draws a thin solid border", () => {
      const style = styleOf((As) => <Box as={As} borderColor="#ff0000" />);
      expect(style).toMatchObject({ borderStyle: "solid", borderColor: "#ff0000", borderWidth: t.borderWidth.thin });
    });

    it("a border takes a raw CSS border as well as a token", () => {
      const style = styleOf((As) => <Box as={As} border="1px solid red" borderBottom="none" borderTop="subtle" />);
      expect(style.border).toBe("1px solid red");
      expect(style.borderBottom).toBe("none");
      expect(style.borderTop).toBe(t.border.subtle);
    });

    it("the background props pass CSS through, with the shorthand written first so the longhands refine it", () => {
      const style = styleOf((As) => (
        <Box as={As} backgroundSize="cover" backgroundColor="canvas.inset" background="url(/a.png) no-repeat" backgroundImage="url(/hero.png)" backgroundPosition="center" backgroundRepeat="no-repeat" />
      ));
      expect(style).toMatchObject({ backgroundImage: "url(/hero.png)", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" });
      const keys = Object.keys(style).filter((k) => k.startsWith("background"));
      expect(keys[0]).toBe("background");
    });

    it("borderRadius and spacing take CSS multi-value shorthands", () => {
      const style = styleOf((As) => <Box as={As} borderRadius="0 0 8px 8px" padding="8px 16px" margin="0 auto" />);
      expect(style).toMatchObject({ borderRadius: "0 0 8px 8px", padding: "8px 16px", margin: "0 auto" });
    });

    it("zIndex takes a token key, a number, or auto", () => {
      const key = Object.keys(t.zIndex)[0] as keyof typeof t.zIndex;
      expect(styleOf((As) => <Box as={As} zIndex={key} />).zIndex).toBe(t.zIndex[key]);
      expect(styleOf((As) => <Box as={As} zIndex={10} />).zIndex).toBe(10);
      expect(styleOf((As) => <Box as={As} zIndex="auto" />).zIndex).toBe("auto");
    });

    it("zIndex takes a key of tokens.zIndex", () => {
      const key = Object.keys(t.zIndex)[0] as keyof typeof t.zIndex;
      render(<Box data-testid="box" zIndex={key} />);
      expect(box().style.zIndex).toBe(String(t.zIndex[key]));
    });
  });

  it("lengths take a step of the Nx scale, or any CSS length as written", () => {
    render(<Box data-testid="box" width="20x" height="100%" minWidth="fit-content" maxWidth="min(90vw, 56rem)" minHeight="5x" maxHeight="320px" flexBasis="10x" />);
    const { style } = box();
    expect(style.width).toBe(t.size["160"]);
    expect(style.height).toBe("100%");
    expect(style.minWidth).toBe("fit-content");
    expect(style.maxWidth).toBe("min(90vw, 56rem)");
    expect(style.minHeight).toBe(t.size["40"]);
    expect(style.maxHeight).toBe("320px");
    expect(style.flexBasis).toBe(t.size["80"]);
  });

  it("alignSelf is passed through", () => {
    render(<Box data-testid="box" alignSelf="center" />);
    expect(box().style.alignSelf).toBe("center");
  });

  it("passes plain CSS props through (overflow, cursor, opacity…)", () => {
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

  it("keeps the token-taking props off the DOM element, and passes everything else", () => {
    render(<Box data-testid="box" padding="1x" border="default" width="10x" id="x" data-extra="y" aria-label="z" />);
    for (const attr of ["padding", "border", "width"]) expect(box()).not.toHaveAttribute(attr);
    expect(box()).toHaveAttribute("id", "x");
    expect(box()).toHaveAttribute("data-extra", "y");
  });

  it("a component built on Box can name itself: the consumer's data-component wins over Box's", () => {
    render(<Box data-testid="box" data-component="Container" />);
    expect(box()).toHaveAttribute("data-component", "Container");
  });

  describe("any CSS property is a prop", () => {
    it("passes CSS props through by their CSS names, with CSS values, and keeps them off the DOM element", () => {
      render(
        <Box data-testid="box" display="grid" gridTemplateColumns="repeat(3, 1fr)" textAlign="center" fontSize="14px" aspectRatio="16 / 9" boxShadow="0 1px 2px red" flex="1 1 0" />,
      );
      const { style } = box();
      expect(style.display).toBe("grid");
      expect(style.gridTemplateColumns).toBe("repeat(3, 1fr)");
      expect(style.textAlign).toBe("center");
      expect(style.fontSize).toBe("14px");
      expect(style.aspectRatio).toBe("16 / 9");
      expect(style.boxShadow).toBe("0 1px 2px red");
      for (const attr of ["gridtemplatecolumns", "textalign", "fontsize", "display"]) expect(box()).not.toHaveAttribute(attr);
    });

    it("writes shorthands before the token props and the longhands, so the longhands refine them whatever the JSX order", () => {
      const style = styleOf((As) => (
        <Box as={As} fontSize="12px" backgroundImage="url(/a.png)" backgroundColor="canvas.inset" font="14px sans-serif" background="red" flexGrow={2} flex="1" />
      ));
      const keys = Object.keys(style);
      expect(keys.indexOf("font")).toBeLessThan(keys.indexOf("fontSize"));
      expect(keys.indexOf("background")).toBeLessThan(keys.indexOf("backgroundColor"));
      expect(keys.indexOf("background")).toBeLessThan(keys.indexOf("backgroundImage"));
      expect(keys.indexOf("flex")).toBeLessThan(keys.indexOf("flexGrow"));
    });

    it("leaves the CSS properties that are DOM attributes as attributes (use style for the CSS)", () => {
      render(<Box data-testid="box" translate="no" />);
      expect(box()).toHaveAttribute("translate", "no");
      expect(box().style.translate).toBe("");
    });

    it("skips an undefined value and does not forward it", () => {
      render(<Box data-testid="box" textAlign={undefined} />);
      expect(box()).not.toHaveAttribute("textalign");
      expect(box().style.textAlign).toBe("");
    });
  });

  describe("border as an object of parts", () => {
    it("is every side by default, with thin, solid and the default border colour filled in", () => {
      const style = styleOf((As) => <Box as={As} border={{}} />);
      expect(style.border).toBe(`${t.borderWidth.thin} solid ${t.borderColor.default}`);
    });

    it("takes the colour and width as tokens, or as raw CSS", () => {
      const tokenStyle = styleOf((As) => <Box as={As} border={{ color: "subtle", width: "thick" }} />);
      expect(tokenStyle.border).toBe(`${t.borderWidth.thick} solid ${t.borderColor.subtle}`);
      const rawStyle = styleOf((As) => <Box as={As} border={{ color: "#ff0000", width: "3px", style: "dashed" }} />);
      expect(rawStyle.border).toBe("3px dashed #ff0000");
      const scaleStyle = styleOf((As) => <Box as={As} border={{ width: "0.25x" }} />);
      expect(scaleStyle.border).toBe(`${t.size["2"]} solid ${t.borderColor.default}`);
    });

    it("draws on the named side, or on several", () => {
      const one = styleOf((As) => <Box as={As} border={{ side: "top", color: "strong" }} />);
      expect(one.borderTop).toBe(`${t.borderWidth.thin} solid ${t.borderColor.strong}`);
      expect(one.border).toBeUndefined();
      const many = styleOf((As) => <Box as={As} border={{ side: ["top", "bottom", "inlineStart"], width: "thick" }} />);
      const thick = `${t.borderWidth.thick} solid ${t.borderColor.default}`;
      expect(many).toMatchObject({ borderTop: thick, borderBottom: thick, borderInlineStart: thick });
    });

    it("takes a list of specs for different sides, written general to specific", () => {
      const style = styleOf((As) => (
        <Box as={As} border={[{ side: "bottom", color: "strong" }, { side: "all", color: "subtle" }, { side: "block", width: "thick" }]} />
      ));
      expect(Object.keys(style).filter((k) => k.startsWith("border"))).toEqual(["border", "borderBlock", "borderBottom"]);
    });

    it("a per-side prop takes an object of parts too", () => {
      const style = styleOf((As) => <Box as={As} borderTop={{ color: "strong", width: "thick" }} border="subtle" />);
      expect(style.borderTop).toBe(`${t.borderWidth.thick} solid ${t.borderColor.strong}`);
      expect(style.border).toBe(t.border.subtle);
    });

    it("uses the dark tokens in dark mode", () => {
      renderInMode(<Box data-testid="box" />, "dark");
      const style = styleOf((As) => <Box as={As} border={{ color: "subtle" }} />);
      expect(style.border).toContain(tokens.dark.borderColor.subtle);
    });

    it("throws for a colour that is neither a token nor CSS", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      expect(() => render(<Box border={{ color: "nope" as never }} />)).toThrow(/Unknown colour "nope"/);
      spy.mockRestore();
    });
  });

  describe("width and height as an object of parts", () => {
    it("sets the size and its bounds together, each from the Nx scale or raw CSS", () => {
      const style = styleOf((As) => <Box as={As} width={{ size: "50%", min: "10x", max: "min(90vw, 56rem)" }} height={{ min: "5x", max: "320px" }} />);
      expect(style).toMatchObject({ width: "50%", minWidth: t.size["80"], maxWidth: "min(90vw, 56rem)", minHeight: t.size["40"], maxHeight: "320px" });
      expect(style.height).toBeUndefined();
    });

    it("an explicit minWidth refines the object, whatever the JSX order", () => {
      const style = styleOf((As) => <Box as={As} minWidth="12px" width={{ size: "20x", min: "10x" }} />);
      expect(style.minWidth).toBe("12px");
      expect(style.width).toBe(t.size["160"]);
    });
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
