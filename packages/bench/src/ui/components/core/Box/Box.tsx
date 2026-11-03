import React from "react";
import { clsx } from "clsx";
import { useTokens } from "../../../mode";
import type { SizeScale, Tokens } from "../../../mode";
import { colorGroups, resolveBorderValue, resolveColorValue } from "../../../utils/colorPaths";
import type { BgColor, BorderColor, BorderToken, CssBorder, CssColor, FgColor } from "../../../utils/colorPaths";
import { mergeProps } from "../../../utils/mergeProps";
import type { PolymorphicProps } from "../../../utils/polymorphic";
import { resolveSize, resolveSpaceValue } from "../../../utils/space";
import type { Length, RawLength, SpaceValue } from "../../../utils/space";
import { CSS_ATTRIBUTE_NAMES, CSS_PROPERTIES, CSS_SHORTHANDS } from "./cssProperties.generated";
import classes from "./Box.module.css";

type Css = React.CSSProperties;

// ── The prop families ───────────────────────────────────────────────────────────────────────────
// Every name is the CSS property of the same name. Each list runs general -> specific (`padding`, then the axis, then
// the side), because that is the order the inline style is written in and so the order CSS resolves a shorthand against
// its longhands: `padding="2x" paddingTop={0}` is 2x on three sides and 0 on top, whatever order the JSX has.

const SIDES = ["Top", "Right", "Bottom", "Left"] as const;
const LOGICAL = ["BlockStart", "BlockEnd", "InlineStart", "InlineEnd"] as const;
type Side = (typeof SIDES)[number];
type Logical = (typeof LOGICAL)[number];

/** `padding`, `paddingBlock`, `paddingInline`, `paddingTop`…, `paddingBlockStart`…: the same set for padding, margin and border. */
const boxModel = (prop: string): string[] => [prop, `${prop}Block`, `${prop}Inline`, ...SIDES.map((s) => `${prop}${s}`), ...LOGICAL.map((l) => `${prop}${l}`)];
type BoxModelProp<P extends string> = P | `${P}Block` | `${P}Inline` | `${P}${Side}` | `${P}${Logical}`;

type PaddingProp = BoxModelProp<"padding">;
type MarginProp = BoxModelProp<"margin">;
/** Offsets: `inset` and its axes and logical sides, plus the physical `top`/`right`/`bottom`/`left`. */
type InsetProp = "inset" | "insetBlock" | "insetInline" | "top" | "right" | "bottom" | "left" | `inset${Logical}`;
type GapProp = "gap" | "rowGap" | "columnGap";
type LengthProp = "width" | "height" | "minWidth" | "maxWidth" | "minHeight" | "maxHeight" | "flexBasis";
type BorderProp = BoxModelProp<"border">;

const PADDING = boxModel("padding");
const MARGIN = boxModel("margin");
const INSET: string[] = ["inset", "insetBlock", "insetInline", "top", "right", "bottom", "left", ...LOGICAL.map((l) => `inset${l}`)];
const GAP: string[] = ["gap", "rowGap", "columnGap"];
const LENGTH: string[] = ["width", "height", "minWidth", "maxWidth", "minHeight", "maxHeight", "flexBasis"];
const BORDER = boxModel("border");

// ── Object forms ────────────────────────────────────────────────────────────────────────────────

/** Which sides a border spec draws on. `"all"` is every side; the rest are the CSS names without the `border` prefix. */
export type BorderSide = "all" | "block" | "inline" | "top" | "right" | "bottom" | "left" | "blockStart" | "blockEnd" | "inlineStart" | "inlineEnd";

/**
 * A border described by its parts, so each can be a token on its own: `{ side: "top", color: "subtle", width: "thick" }`.
 * Left out, the width is `"thin"`, the style `"solid"`, and the colour `borderColor.default`.
 */
export type BorderSideSpec = {
  /** A `borderColor` token path or any CSS colour. */
  color?: BorderColor | CssColor;
  /** A key of `tokens.borderWidth` (`"thin"`, `"thick"`…), a step of the Nx scale, or a raw CSS length. */
  width?: keyof Tokens["borderWidth"] | SizeScale | RawLength;
  /** Any CSS `border-style`. */
  style?: Css["borderStyle"];
};
export type BorderSpec = BorderSideSpec & {
  /** One side or several (`["top", "bottom"]`). @default "all" */
  side?: BorderSide | BorderSide[];
};

/** A width (or height) described by its parts: the size itself and its bounds, in one prop. Each takes the Nx scale or any CSS length. */
export type SizeSpec = { size?: Length; min?: Length; max?: Length };

type SpaceProps = { [K in GapProp | PaddingProp | InsetProp]?: SpaceValue } & { [K in MarginProp]?: SpaceValue | "auto" };
type BorderProps = {
  /**
   * `border` and its axes and sides (`borderTop`, `borderBlock`, `borderInlineStart`…). Each takes a `tokens.border` entry
   * (`"subtle"`), a raw CSS border (`"1px solid red"`), or an object of parts (`{ color, width, style }`).
   * `border` alone also takes `side`, or a list of specs for different sides, so one prop says it all:
   * `border={{ side: ["top", "bottom"], color: "subtle", width: "thick" }}`.
   */
  [K in Exclude<BorderProp, "border">]?: BorderToken | CssBorder | BorderSideSpec;
} & { border?: BorderToken | CssBorder | BorderSpec | BorderSpec[] };
type LengthProps = { [K in Exclude<LengthProp, "width" | "height">]?: Length } & {
  /**
   * The width: a step of the Nx scale (`"20x"` = 160px) or any CSS length as written (`"100%"`, `"fit-content"`,
   * `"min(90vw, 56rem)"`). Or an object, to set the size and its bounds together: `width={{ size: "50%", min: "10x", max: "40x" }}`.
   * `height` works the same.
   */
  width?: Length | SizeSpec;
  height?: Length | SizeSpec;
};

type TokenProp = "color" | "backgroundColor" | "borderColor" | "borderRadius" | "zIndex" | GapProp | PaddingProp | MarginProp | InsetProp | LengthProp | BorderProp;
type AttributeName = (typeof CSS_ATTRIBUTE_NAMES)[number];

export type BoxOwnProps = {
  /**
   * Element colours: a token path (`backgroundColor` -> `bgColor.*`, `borderColor` -> `borderColor.*`, `color` (text) ->
   * `fgColor.*`) or any CSS colour (`"transparent"`, `"currentColor"`, `"#fff"`, `"rgb(0 0 0 / 50%)"`, `"red"`, `"var(--brand)"`).
   */
  backgroundColor?: BgColor | CssColor;
  /** Applies a `borderWidth.thin` solid border on every side in this colour. For one side, or another width, use `border`. */
  borderColor?: BorderColor | CssColor;
  color?: FgColor | CssColor;
  /** A key of `tokens.borderRadius` (`"md"`, `"full"`…), a step of the Nx scale (`"0.5x"`), or a raw CSS length (`"3px"`, `"0 0 8px 8px"`). */
  borderRadius?: keyof Tokens["borderRadius"] | SizeScale | RawLength;
  /** A key of `tokens.zIndex` (`"dialog"`, `"overlay"`, …), or any CSS z-index (`10`, `"auto"`). */
  zIndex?: keyof Tokens["zIndex"] | number | "auto";
  /** CSS `flex-direction`. @default "column" */
  flexDirection?: Css["flexDirection"];
} & SpaceProps &
  LengthProps &
  BorderProps &
  /**
   * Every other CSS property, by its CSS name and with CSS values: `display`, `alignItems`, `gridTemplateColumns`,
   * `textAlign`, `fontSize`, `overflow`, `opacity`… A shorthand (`flex`, `font`, `background`) is written before the
   * longhands, so the longhands refine it. For a CSS property that is also a DOM attribute (`content`, `translate`,
   * SVG geometry) use `style`. Anything else a consumer needs goes through `style`, which wins over every prop.
   */
  Partial<Omit<Css, TokenProp | AttributeName>>;

export type BoxProps<As extends React.ElementType = "div"> = PolymorphicProps<As, "div", BoxOwnProps>;

type Props = Pick<Tokens, "space" | "size" | "border" | "borderColor" | "borderWidth" | "display">;

const SPACE_PROPS = new Set([...GAP, ...PADDING, ...INSET]);
const MARGIN_PROPS = new Set(MARGIN);
const LENGTH_PROPS = new Set(LENGTH);
const BORDER_PROPS = new Set(BORDER);
const CSS_PROPS = new Set<string>(CSS_PROPERTIES);
const SHORTHANDS = new Set<string>(CSS_SHORTHANDS);

/** The token-taking props, in the order their styles are written (see "The prop families"). */
const SPACING_ORDER = [...GAP, ...PADDING, ...MARGIN, ...INSET];

const isSpec = (value: unknown): value is object => typeof value === "object" && value !== null;

function resolveBorderWidth(tokens: Props, value: NonNullable<BorderSideSpec["width"]>): string {
  return value in tokens.borderWidth ? tokens.borderWidth[value as keyof Tokens["borderWidth"]] : resolveSpaceValue(tokens, value as SpaceValue);
}

/** One border described by its parts -> the CSS `border` shorthand value. */
function borderSpecToCss(tokens: Props, { color, width = "thin", style = "solid" }: BorderSideSpec): string {
  return `${resolveBorderWidth(tokens, width)} ${style} ${resolveColorValue(colorGroups(tokens).borderColor, color ?? "default")}`;
}

const sideProp = (side: BorderSide) => (side === "all" ? "border" : `border${side[0].toUpperCase()}${side.slice(1)}`);

/** Every border prop -> `[css property, value]` pairs, general to specific. */
function resolveBorders(tokens: Props, props: Record<string, unknown>): [string, string][] {
  const out: [string, string][] = [];
  for (const prop of BORDER) {
    const value = props[prop];
    if (value === undefined) continue;
    if (!isSpec(value)) {
      out.push([prop, resolveBorderValue(tokens.border, value as string)]);
    } else if (prop === "border") {
      for (const spec of Array.isArray(value) ? (value as BorderSpec[]) : [value as BorderSpec]) {
        const sides = [spec.side ?? "all"].flat();
        for (const side of sides) out.push([sideProp(side), borderSpecToCss(tokens, spec)]);
      }
    } else {
      out.push([prop, borderSpecToCss(tokens, value as BorderSideSpec)]);
    }
  }
  // A spec can name any side, so put the pairs in the general-to-specific order again (stable: a later spec wins a tie).
  return out.sort(([a], [b]) => BORDER.indexOf(a) - BORDER.indexOf(b));
}

/** `width`/`height` as an object -> its `width`, `minWidth` and `maxWidth` (or the `height` ones). */
function sizeSpecToStyle(tokens: Props, prop: "width" | "height", spec: SizeSpec): Record<string, string> {
  const cap = prop === "width" ? "Width" : "Height";
  const out: Record<string, string> = {};
  if (spec.size !== undefined) out[prop] = resolveSize(tokens, spec.size);
  if (spec.min !== undefined) out[`min${cap}`] = resolveSize(tokens, spec.min);
  if (spec.max !== undefined) out[`max${cap}`] = resolveSize(tokens, spec.max);
  return out;
}

/** Radius: a named step, a step of the Nx scale, or a raw CSS length. */
function resolveRadius(tokens: Tokens, value: keyof Tokens["borderRadius"] | SizeScale | RawLength): string {
  return value in tokens.borderRadius ? tokens.borderRadius[value as keyof Tokens["borderRadius"]] : resolveSpaceValue(tokens, value as SpaceValue);
}

/**
 * Split Box's props into the styles they make and the DOM props that remain. Written in this order, so each layer
 * refines the one before: CSS shorthands, then the token props (spacing, lengths, borders), then CSS longhands.
 */
function splitProps(tokens: Tokens, props: Record<string, unknown>) {
  const shorthands: Css = {};
  const longhands: Css = {};
  const spacing: Record<string, string> = {};
  const lengths: Record<string, string> = {};
  const rest: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(props)) {
    if (SPACE_PROPS.has(key) || MARGIN_PROPS.has(key) || LENGTH_PROPS.has(key) || BORDER_PROPS.has(key)) continue;
    if (CSS_PROPS.has(key)) {
      if (value !== undefined) ((SHORTHANDS.has(key) ? shorthands : longhands) as Record<string, unknown>)[key] = value;
    } else {
      rest[key] = value;
    }
  }

  for (const prop of SPACING_ORDER) {
    const value = props[prop] as SpaceValue | "auto" | undefined;
    if (value === undefined) continue;
    spacing[prop] = MARGIN_PROPS.has(prop) && value === "auto" ? "auto" : resolveSpaceValue(tokens, value as SpaceValue);
  }
  for (const prop of LENGTH) {
    const value = props[prop] as Length | SizeSpec | undefined;
    if (value === undefined) continue;
    if (isSpec(value)) Object.assign(lengths, sizeSpecToStyle(tokens, prop as "width" | "height", value as SizeSpec));
    else lengths[prop] = resolveSize(tokens, value);
  }

  return { shorthands, longhands, token: { ...spacing, ...lengths, ...Object.fromEntries(resolveBorders(tokens, props)) } as Css, rest };
}

/**
 * A flexbox container: a `div` (or any `as` element) whose props are CSS properties, by their CSS names and with CSS
 * values. Where a CSS value is a design decision (colours, radius, spacing, borders, z-index) the prop also takes a token;
 * lengths take the Nx scale or any CSS length. It is `display: flex` by default.
 *
 * A component built on Box names itself with its own `data-component`: the consumer's props win over Box's own
 * (`mergeProps`), so `<Box data-component="Container">` replaces `"Box"`.
 */
export function Box<As extends React.ElementType = "div">({
  as,
  backgroundColor,
  borderColor,
  color,
  borderRadius,
  zIndex,
  flexDirection = "column",
  className,
  ...allProps
}: BoxProps<As>) {
  const Component: React.ElementType = as ?? "div";
  const tokens = useTokens();
  const { shorthands, longhands, token, rest } = splitProps(tokens, allProps as Record<string, unknown>);

  const style: Css = {
    flexDirection,
    ...shorthands,
    ...(backgroundColor ? { backgroundColor: resolveColorValue(colorGroups(tokens).bgColor, backgroundColor) } : {}),
    ...(color ? { color: resolveColorValue(colorGroups(tokens).fgColor, color) } : {}),
    ...(borderRadius ? { borderRadius: resolveRadius(tokens, borderRadius) } : {}),
    ...(borderColor
      ? { borderStyle: "solid", borderWidth: tokens.borderWidth.thin, borderColor: resolveColorValue(colorGroups(tokens).borderColor, borderColor) }
      : {}),
    ...(zIndex === undefined ? {} : { zIndex: zIndex in tokens.zIndex ? tokens.zIndex[zIndex as keyof Tokens["zIndex"]] : zIndex }),
    ...token,
    ...longhands,
  };

  return (
    <Component
      {...mergeProps(
        {
          "data-component": "Box",
          className: clsx(classes.Box, className as string | undefined),
          style,
        },
        rest,
      )}
    />
  );
}
