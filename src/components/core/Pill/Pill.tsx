import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import type {
  CubeTheme,
  PillIntensity,
  PillSurface,
  PillSurfaceColors,
  ThemeTokens,
} from "../../../theme/types";
import { tokenOutput } from "../../../theme/tokenOutput";
import styles from "./Pill.module.css";

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

function pillLayoutVars(geom: ThemeTokens["sizes"]["pill"]): Record<string, string> {
  return {
    "--cube-pill-paddingInline": geom.paddingInline,
    "--cube-pill-paddingBlock": geom.paddingBlock,
    "--cube-pill-borderRadius": geom.borderRadius,
    "--cube-pill-gap": geom.gap,
    "--cube-pill-height": geom.height,
  };
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
  className,
  children,
  style,
  ...rest
}: PillProps & Omit<React.HTMLAttributes<HTMLElement>, "children">) {
  const tokens = useTheme(theme);
  const surface: PillSurface = border ? "bordered" : "filled";
  const Component: React.ElementType = as ?? (href ? "a" : "span");
  const pillKey = `${shade}-${intensity}-${surface}`;

  const classNames = [
    "cube-focusable",
    "cube-Pill",
    styles["cube-Pill"],
    VARIANT_GLOBAL_CLASS[variant],
    VARIANT_CLASS[variant],
    theme && "cube-Pill--themed",
    theme && styles["cube-Pill--themed"],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const inlineVars = theme
    ? ({
        ...recipeToActiveVars(
          resolvePillRecipe(tokens.colors.functional.pill, shade, intensity, surface)
        ),
        ...pillLayoutVars(tokens.sizes.pill),
        "--cube-sizes-borderWidth-thin": tokens.sizes.borderWidth.thin,
        "--cube-typography-fontFamily-base": tokens.typography.fontFamily.base,
      } as React.CSSProperties)
    : undefined;

  const anchorProps =
    Component === "a" && href
      ? { href, ...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>) }
      : rest;

  return (
    <Component
      className={classNames}
      data-cube-pill={theme ? undefined : pillKey}
      style={{ ...(inlineVars ?? {}), ...(style ?? {}) }}
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
