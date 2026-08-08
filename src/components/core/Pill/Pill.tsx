import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import type {
  BorderRadiusTokens,
  BorderWidthTokens,
  CubeTheme,
  GlobalColorPath,
  PillIntensity,
  PillSurface,
  PillSurfaceColors,
  ThemeTokens,
} from "../../../theme/types";
import { resolveGlobalColorOrCss } from "../../../theme/globalColor";
import { tokenOutput } from "../../../theme/tokenOutput";
import type { SpaceToken } from "../../../utils/spaceToken";
import { spaceTokenToCssVar } from "../../../utils/spaceToken";
import styles from "./Pill.module.css";

/** Named corner-radius stop (`sizes.borderRadius`) or an 8pt scale token (`"0.5x"`) for a step the named scale doesn't have. */
export type PillBorderRadius = keyof BorderRadiusTokens | SpaceToken;
/** Named width stop (`sizes.borderWidth`: `"thin"` | `"thick"`) or a raw CSS length (`"3px"`). */
export type PillBorderWidth = keyof BorderWidthTokens | (string & {});

const SPACE_TOKEN_PATTERN = /^\d+(?:\.\d+)?x$/;
function isSpaceToken(value: unknown): value is SpaceToken {
  return typeof value === "string" && SPACE_TOKEN_PATTERN.test(value);
}

function resolveBorderRadius(
  value: PillBorderRadius | undefined,
  borderRadius: ThemeTokens["sizes"]["borderRadius"],
): string | undefined {
  if (value === undefined) return undefined;
  if (isSpaceToken(value)) return spaceTokenToCssVar(value);
  return borderRadius[value];
}

function isBorderWidthKey(value: string): value is keyof BorderWidthTokens {
  return value === "thin" || value === "thick";
}

function resolveBorderWidth(
  value: PillBorderWidth | undefined,
  borderWidth: ThemeTokens["sizes"]["borderWidth"],
): string | undefined {
  if (value === undefined) return undefined;
  if (isBorderWidthKey(value)) return borderWidth[value];
  return value;
}

/** Shade keys from `token-output.json` — add `yellow.json`, etc. alongside `gray.json`. */
export type PillShade = keyof typeof tokenOutput.pillColors;
export type PillTextVariant = "bodyXs" | "bodySm" | "bodyMd";
export type { PillIntensity, PillSurface };

const VARIANT_CLASS: Record<PillTextVariant, string> = {
  bodyXs: styles["cube-Pill--bodyXs"],
  bodySm: styles["cube-Pill--bodySm"],
  bodyMd: styles["cube-Pill--bodyMd"],
};

/** Stable global names (CSS modules hash the module classes). */
const VARIANT_GLOBAL_CLASS: Record<PillTextVariant, string> = {
  bodyXs: "cube-Pill--bodyXs",
  bodySm: "cube-Pill--bodySm",
  bodyMd: "cube-Pill--bodyMd",
};

function recipeToActiveVars(recipe: PillSurfaceColors): Record<string, string> {
  return {
    "--cube-pill-active-bg": recipe.bgColor,
    "--cube-pill-active-fg": recipe.fgColor,
    "--cube-pill-active-border": recipe.borderColor,
  };
}

function resolvePillRecipe(
  pill: ThemeTokens["colors"]["functional"]["pill"],
  shade: PillShade,
  intensity: PillIntensity,
  surface: PillSurface
): PillSurfaceColors {
  const shadeBlock = pill[shade];
  const intensityBlock = shadeBlock?.[intensity];
  const recipe = intensityBlock?.[surface];
  if (!recipe) {
    throw new Error(
      `Missing pill recipe: colors.functional.pill.${shade}.${intensity}.${surface}`
    );
  }
  return recipe;
}

function pillLayoutVars(
  geom: ThemeTokens["sizes"]["pill"],
  borderRadiusScale: ThemeTokens["sizes"]["borderRadius"],
  borderWidthScale: ThemeTokens["sizes"]["borderWidth"],
  overrides: {
    paddingInline?: SpaceToken;
    paddingBlock?: SpaceToken;
    borderRadius?: PillBorderRadius;
    borderWidth?: PillBorderWidth;
  },
): Record<string, string> {
  const vars: Record<string, string> = {
    "--cube-pill-paddingInline": overrides.paddingInline
      ? spaceTokenToCssVar(overrides.paddingInline)
      : geom.paddingInline,
    "--cube-pill-paddingBlock": overrides.paddingBlock
      ? spaceTokenToCssVar(overrides.paddingBlock)
      : geom.paddingBlock,
    "--cube-pill-borderRadius":
      resolveBorderRadius(overrides.borderRadius, borderRadiusScale) ?? geom.borderRadius,
    "--cube-pill-gap": geom.gap,
    "--cube-pill-height": geom.height,
  };
  const resolvedBorderWidth = resolveBorderWidth(overrides.borderWidth, borderWidthScale);
  if (resolvedBorderWidth !== undefined) {
    vars["--cube-pill-borderWidth"] = resolvedBorderWidth;
  }
  return vars;
}

export interface PillProps {
  /** Color family — maps to Figma `shade` (token file per shade). */
  shade?: PillShade;
  /** Emphasis step — maps to Figma `intensity`. */
  intensity?: PillIntensity;
  /** When true, uses the `bordered` surface recipe (Figma `border?`). */
  border?: boolean;
  /**
   * Text size — defaults to `bodyXs` (12px). Override when the pill should match
   * a different `Text` body size.
   */
  variant?: PillTextVariant;
  /** Render as static label, anchor, or a custom component (e.g. react-router `Link`). */
  as?: React.ElementType;
  href?: string;
  leadingVisual?: React.ReactNode;
  /** Pass `<Icon size="…">` — pill height stays fixed regardless of icon size. */
  trailingVisual?: React.ReactNode;
  /** Override chip geometry (`sizes.pill`) or colors for this instance. */
  theme?: CubeTheme;
  /** Per-instance override for horizontal padding — an 8pt scale token (`"1x"`). Defaults to `sizes.pill.paddingInline`. */
  paddingInline?: SpaceToken;
  /** Per-instance override for vertical padding — an 8pt scale token (`"0.25x"`). Defaults to `sizes.pill.paddingBlock`. */
  paddingBlock?: SpaceToken;
  /** Per-instance override for corner radius — a named `sizes.borderRadius` stop or an 8pt scale token. Defaults to `sizes.pill.borderRadius`. */
  borderRadius?: PillBorderRadius;
  /** Per-instance override for border color — a `colors.global` dot-path or raw CSS color. Defaults to the shade/intensity/surface recipe's border color. */
  borderColor?: GlobalColorPath;
  /** Per-instance override for border width — a named `sizes.borderWidth` stop (`"thin"` | `"thick"`) or a raw CSS length. Defaults to `sizes.borderWidth.thin`. */
  borderWidth?: PillBorderWidth;
  className?: string;
  children?: React.ReactNode;
}

/** Static chip / tag — not a button; colors do not change on hover. */
export function Pill({
  shade = "gray",
  intensity = "light",
  border = false,
  variant = "bodyXs",
  as,
  href,
  leadingVisual,
  trailingVisual,
  theme,
  paddingInline,
  paddingBlock,
  borderRadius,
  borderColor,
  borderWidth,
  className,
  children,
  style,
  ...rest
}: PillProps & Omit<React.HTMLAttributes<HTMLElement>, "children">) {
  const tokens = useTheme(theme);
  const surface: PillSurface = border ? "bordered" : "filled";
  const Component: React.ElementType = as ?? (href ? "a" : "span");
  const pillKey = `${shade}-${intensity}-${surface}`;
  const hasLayoutOverride =
    paddingInline !== undefined ||
    paddingBlock !== undefined ||
    borderRadius !== undefined ||
    borderWidth !== undefined;

  const classNames = [
    "cube-focusable",
    "cube-Pill",
    styles["cube-Pill"],
    VARIANT_GLOBAL_CLASS[variant],
    VARIANT_CLASS[variant],
    // `--themed` only controls color (see Pill.module.css) — must stay tied to
    // `theme` alone. Layout vars (padding/radius) are read unconditionally by
    // the base `.cube-Pill` rule, so a layout-only override never needs this class.
    theme && "cube-Pill--themed",
    theme && styles["cube-Pill--themed"],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const layoutOverrideVars = hasLayoutOverride
    ? pillLayoutVars(tokens.sizes.pill, tokens.sizes.borderRadius, tokens.sizes.borderWidth, {
        paddingInline,
        paddingBlock,
        borderRadius,
        borderWidth,
      })
    : undefined;

  const inlineVars =
    theme || layoutOverrideVars
      ? ({
          ...(theme
            ? recipeToActiveVars(
                resolvePillRecipe(tokens.colors.functional.pill, shade, intensity, surface)
              )
            : {}),
          ...(theme
            ? pillLayoutVars(tokens.sizes.pill, tokens.sizes.borderRadius, tokens.sizes.borderWidth, {})
            : {}),
          ...layoutOverrideVars,
          "--cube-sizes-borderWidth-thin": tokens.sizes.borderWidth.thin,
          "--cube-typography-fontFamily-base": tokens.typography.fontFamily.base,
        } as React.CSSProperties)
      : undefined;

  // Direct style property (not a CSS var) — wins over both the [data-cube-pill]
  // shade/intensity color rule and .cube-Pill--themed by cascade specificity,
  // regardless of which one is otherwise active.
  const borderColorOverride =
    borderColor !== undefined
      ? resolveGlobalColorOrCss(borderColor, tokens.colors.global)
      : undefined;

  const anchorProps =
    Component === "a" && href
      ? { href, ...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>) }
      : rest;

  return (
    <Component
      className={classNames}
      data-cube-pill={theme ? undefined : pillKey}
      style={{
        ...(inlineVars ?? {}),
        ...(borderColorOverride !== undefined ? { borderColor: borderColorOverride } : {}),
        ...(style ?? {}),
      }}
      {...anchorProps}
    >
      {leadingVisual ? (
        <span className={styles["cube-Pill__leadingVisual"]}>{leadingVisual}</span>
      ) : null}
      {children}
      {trailingVisual ? (
        <span className={styles["cube-Pill__trailingVisual"]}>{trailingVisual}</span>
      ) : null}
    </Component>
  );
}
