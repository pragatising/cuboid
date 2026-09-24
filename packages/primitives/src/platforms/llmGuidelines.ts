import type { PlatformInitializer } from "../types/platformInitializer";
import { hasLlmExtensions } from "../filters/hasLlmExtensions.ts";
import type { PlatformConfig } from "style-dictionary/types";

/**
 * Markdown LLM-guidelines doc output. Matches Primer's
 * platforms/llmGuidelines.ts.
 */
export const llmGuidelines: PlatformInitializer = (outputFile: string, prefix: string | undefined, buildPath: string): PlatformConfig => ({
  prefix,
  buildPath,
  preprocessors: ["inheritGroupProperties"],
  transforms: ["name/pathToKebabCase"],
  files: [
    {
      destination: outputFile,
      format: "markdown/llm-guidelines",
      filter: hasLlmExtensions,
      options: {
        outputReferences: false,
      },
    },
  ],
});
