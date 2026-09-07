import type { ThemeTokens } from "./types";
import { globalColorsToCssVars } from "./globalColor";

function cssSegment(key: string): string {
  return key.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`);
}

/** Rebind global surface tokens used by Box and similar primitives. */
export function functionalSurfaceCubeOverride(
  tokens: ThemeTokens,
): Record<string, string> {
  const { borderRadius, borderWidth } = tokens.sizes;

  return {
    ...globalColorsToCssVars(tokens.colors.global),
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
  const { token: t, surface } = tokens.colors.global.syntax;
  return {
    "--cube-color-syntax-token-key": t.key,
    "--cube-color-syntax-token-string": t.string,
    "--cube-color-syntax-token-string-url": t.stringUrl,
    "--cube-color-syntax-token-string-email": t.stringEmail,
    "--cube-color-syntax-token-string-uuid": t.stringUuid,
    "--cube-color-syntax-token-number-literal": t.numberLiteral,
    "--cube-color-syntax-token-boolean-literal": t.booleanLiteral,
    "--cube-color-syntax-token-null-literal": t.nullLiteral,
    "--cube-color-syntax-token-bracket": t.bracket,
    "--cube-color-syntax-token-bracket-nested": t.bracketNested,
    "--cube-color-syntax-surface-row-hover-bg": surface.rowHoverBg,
    "--cube-color-syntax-surface-collapsed-row-bg": surface.collapsedRowBg,
    "--cube-color-syntax-surface-watch-mark": surface.watchMark,
    "--cube-color-syntax-surface-watch-mark-hover": surface.watchMarkHover,
    "--cube-color-syntax-surface-watch-row-bg": surface.watchRowBg,
  };
}
