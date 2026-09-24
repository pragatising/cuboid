import type { LocalOptions, PlatformConfig } from "style-dictionary/types";

/**
 * The signature every platforms/*.ts file exports — one function per
 * output target, returning a real Style Dictionary PlatformConfig.
 * Matches Primer's types/platformInitializer.d.ts.
 */
export type PlatformInitializer = (
  outputFile: string,
  prefix: string | undefined,
  buildPath: string,
  options?: LocalOptions,
) => PlatformConfig;
