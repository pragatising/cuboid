import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import type {
  ButtonVariantInteractiveColors,
  CubeTheme,
  PillIntensity,
  PillSurface,
  TextTokens,
  ThemeTokens,
} from "../../../theme/types";
import themeOutput from "../../../theme/output/theme.json";
import styles from "./Pill.module.css";

/** Shade keys from `pillColors` in theme.json — add `yellow.json`, etc. alongside `gray.json`. */
export type PillShade = keyof typeof themeOutput.pillColors;
export type PillTextVariant = keyof TextTokens;
export type { PillIntensity, PillSurface };

const PILL_STATES = ["rest", "hover", "pressed", "disabled"] as const;

const VARIANT_CLASS: Partial<Record<PillTextVariant, string>> = {
  caption: styles["cube-Pill--caption"],
  bodySmall: styles["cube-Pill--bodySmall"],
  bodyMedium: styles["cube-Pill--bodyMedium"],
  bodyLarge: styles["cube-Pill--bodyLarge"],
};

/** Stable global names (CSS modules hash the module classes). */
const VARIANT_GLOBAL_CLASS: Partial<Record<PillTextVariant, string>> = {
  caption: "cube-Pill--caption",
  bodySmall: "cube-Pill--bodySmall",
  bodyMedium: "cube-Pill--bodyMedium",
  bodyLarge: "cube-Pill--bodyLarge",
};

function recipeToActiveVars(recipe: ButtonVariantInteractiveColors): Record<string, string> {
  const out: Record<string, string> = {};
  for (const s of PILL_STATES) {
    out[`--cube-pill-active-bg-${s}`] = recipe.bgColor[s];
    out[`--cube-pill-active-fg-${s}`] = recipe.fgColor[s];
    out[`--cube-pill-active-border-${s}`] = recipe.borderColor[s];
  }
  return out;
}

function resolvePillRecipe(
  pill: ThemeTokens["colors"]["functional"]["pill"],
  shade: PillShade,
  intensity: PillIntensity,
  surface: PillSurface
): ButtonVariantInteractiveColors {
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
   * Text size — defaults to `bodySmall` (12px). Override when the pill should match
   * a different `Text` variant.
   */
  variant?: PillTextVariant;
  /** Render as static label, anchor, or a custom component (e.g. react-router `Link`). */
  as?: React.ElementType;
  href?: string;
  leadingVisual?: React.ReactNode;
  trailingVisual?: React.ReactNode;
  /** Override chip geometry (`sizes.pill`) or colors for this instance. */
  theme?: CubeTheme;
  className?: string;
  children?: React.ReactNode;
}

export function Pill({
  shade = "gray",
  intensity = "light",
  border = false,
  variant = "bodySmall",
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

  // Default: colors from theme.css via [data-cube-pill] (no inline state vars).
  // With `theme` prop: re-bind --cube-pill-active-* like Button does for overrides.
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
      {leadingVisual && <span className={styles["cube-Pill__leadingVisual"]}>{leadingVisual}</span>}
      {children}
      {trailingVisual && <span className={styles["cube-Pill__trailingVisual"]}>{trailingVisual}</span>}
    </Component>
  );
}
