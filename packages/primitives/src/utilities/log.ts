import type { PlatformConfig } from "style-dictionary/types";

/**
 * One shared logging entry point for build scripts, so output is
 * consistent (level, verbosity) instead of scattered raw console.log/
 * console.error calls — matches Primer's utilities/log.ts, wired to the
 * same Style Dictionary PlatformConfig.log settings cuboidStyleDictionary
 * already sets. Replaces the ad hoc console.error/process.exit pairs
 * throughout the old scripts/build-theme.mjs (see
 * docs/token-architecture-migration.md §1 for the bug that motivated
 * replacing those).
 */
type LogLevel = "info" | "warning" | "error";

function logMessage(message: string, level: LogLevel, config?: PlatformConfig): void {
  const verbosity = config?.log?.verbosity;
  const warnings = config?.log?.warnings;

  if (verbosity === "silent" && level !== "error") return;
  if (verbosity === "default" && level === "info") return;
  if ((warnings === "disabled" || warnings === "warn") && level === "info") return;
  if (warnings === "disabled" && level === "warning") return;

  if (level === "warning") {
    console.warn(message);
    return;
  }
  if (level === "error") {
    console.error(message);
    return;
  }
  console.log(message);
}

export const log = {
  info: (message: string, config?: PlatformConfig) => logMessage(message, "info", config),
  warning: (message: string, config?: PlatformConfig) => logMessage(message, "warning", config),
  error: (message: string, config?: PlatformConfig) => logMessage(message, "error", config),
};
