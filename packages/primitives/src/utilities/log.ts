/**
 * One shared logging entry point for build scripts, so output is
 * consistent (level, formatting) instead of scattered raw console.log/
 * console.error calls — matches Primer's utilities/log.ts. Replaces the
 * ad hoc console.error/process.exit pairs throughout the old
 * scripts/build-theme.mjs (see docs/token-architecture-migration.md §1
 * for the bug that motivated replacing those).
 *
 * Not yet implemented — stub only.
 */
export function log(_message: string): void {
  throw new Error("not implemented");
}
