import type { Config, PlatformConfig } from "style-dictionary/types";

/**
 * The signature for a shared helper that builds one Style Dictionary
 * Config from a (source, include, options) triple — the entry script
 * (Group 20) uses this shape to avoid repeating platform wiring per
 * build call. Matches Primer's types/styleDictionaryConfigGenerator.d.ts.
 */
export interface ConfigGeneratorOptions {
  buildPath: string;
  prefix?: string;
  themed?: boolean;
  theme?: string | [string | undefined, string | undefined];
}

export type StyleDictionaryConfigGenerator = (
  outputName: string,
  source: string[],
  include: string[],
  options: ConfigGeneratorOptions,
  platforms?: Record<string, PlatformConfig | undefined>,
) => Config;
