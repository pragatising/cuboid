/**
 * One build-input entry: which source/include files produce one named
 * output, optionally for a specific theme. Matches Primer's
 * types/tokenBuildInput.d.ts.
 */
export interface TokenBuildInput {
  /** Output filename, without extension. */
  filename: string;
  /** Whether this theme should also be exported to Figma. */
  exportToFigma: boolean;
  /** File paths (relative or glob) to token files included in output. */
  source: string[];
  /** The theme mode this build is for, if any. */
  theme?: string;
  /** File paths available for reference resolution but not emitted (e.g. base color scales). */
  include: string[];
}
