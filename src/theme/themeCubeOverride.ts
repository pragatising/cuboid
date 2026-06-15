import type { ThemeTokens } from "./types";

function cssSegment(key: string): string {
  return key.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`);
}

/** Rebind functional surface tokens used by Box and similar primitives. */
export function functionalSurfaceCubeOverride(
  tokens: ThemeTokens,
): Record<string, string> {
  const { functional } = tokens.colors;
  const { background, border, foreground } = functional;
  const { borderRadius, borderWidth } = tokens.sizes;

  return {
    "--cube-colors-functional-background-default": background.default,
    "--cube-colors-functional-background-muted": background.muted,
    "--cube-colors-functional-background-inset": background.inset,
    "--cube-colors-functional-background-emphasis": background.emphasis,
    "--cube-colors-functional-background-disabled": background.disabled,
    "--cube-colors-functional-background-transparent": background.transparent,
    "--cube-colors-functional-background-inverse": background.inverse,
    "--cube-colors-functional-background-neutral-muted": background.neutral.muted,
    "--cube-colors-functional-background-neutral-emphasis": background.neutral.emphasis,
    "--cube-colors-functional-border-default": border.default,
    "--cube-colors-functional-border-muted": border.muted,
    "--cube-colors-functional-foreground-default": foreground.default,
    "--cube-colors-functional-foreground-muted": foreground.muted,
    "--cube-colors-functional-foreground-disabled": foreground.disabled,
    "--cube-colors-functional-foreground-on-emphasis": foreground.onEmphasis,
    "--cube-colors-functional-foreground-link": foreground.link,
    "--cube-colors-functional-foreground-white": foreground.white,
    "--cube-colors-functional-foreground-neutral": foreground.neutral,
    "--cube-sizes-borderWidth-thin": borderWidth.thin,
    "--cube-sizes-borderRadius-sm": borderRadius.sm,
    "--cube-sizes-borderRadius-md": borderRadius.md,
    "--cube-sizes-borderRadius-lg": borderRadius.lg,
    "--cube-sizes-borderRadius-xl": borderRadius.xl,
    "--cube-sizes-borderRadius-full": borderRadius.full,
  };
}

/** Rebind stack gap/padding scale tokens. */
export function stackScaleCubeOverride(tokens: ThemeTokens): Record<string, string> {
  const { gap, padding } = tokens.sizes.stack;
  const out: Record<string, string> = {};

  for (const [key, value] of Object.entries(gap)) {
    out[`--cube-stack-gap-${cssSegment(key)}`] = value;
  }
  for (const [key, value] of Object.entries(padding)) {
    out[`--cube-stack-padding-${cssSegment(key)}`] = value;
  }

  return out;
}

/** Rebind code-block typography tokens used by CodeSurface. */
export function codeBlockTypographyCubeOverride(
  tokens: ThemeTokens,
): Record<string, string> {
  const { text, fontFamily } = tokens.typography;
  return {
    "--cube-typography-text-code-block-fontFamily":
      text.codeBlock.fontFamily ?? fontFamily.mono,
    "--cube-typography-text-code-block-fontSize": text.codeBlock.fontSize,
    "--cube-typography-text-code-block-lineHeight": String(text.codeBlock.lineHeight),
  };
}

/** Surface + syntax + typography overrides for CodeSurface local themes. */
export function codeSurfaceCubeOverride(tokens: ThemeTokens): Record<string, string> {
  return {
    ...functionalSurfaceCubeOverride(tokens),
    ...syntaxColorsCubeOverride(tokens),
    ...codeBlockTypographyCubeOverride(tokens),
  };
}

/** Rebind JSON syntax colours used by CodeSurface and JsonCodeView. */
export function syntaxColorsCubeOverride(tokens: ThemeTokens): Record<string, string> {
  const s = tokens.colors.functional.syntax;
  return {
    "--cube-color-syntax-key": s.key,
    "--cube-color-syntax-string": s.string,
    "--cube-color-syntax-string-url": s.stringUrl,
    "--cube-color-syntax-string-email": s.stringEmail,
    "--cube-color-syntax-string-uuid": s.stringUuid,
    "--cube-color-syntax-variable": s.variable,
    "--cube-color-syntax-number-literal": s.numberLiteral,
    "--cube-color-syntax-boolean-literal": s.booleanLiteral,
    "--cube-color-syntax-null-literal": s.nullLiteral,
    "--cube-color-syntax-bracket": s.bracket,
    "--cube-color-syntax-bracket-nested": s.bracketNested,
    "--cube-color-syntax-row-hover-bg": s.rowHoverBg,
    "--cube-color-syntax-watch-mark": s.watchMark,
    "--cube-color-syntax-watch-mark-hover": s.watchMarkHover,
    "--cube-color-syntax-watch-row-bg": s.watchRowBg,
  };
}
