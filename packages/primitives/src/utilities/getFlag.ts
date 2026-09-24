/**
 * Reads a CLI flag from process.argv. Matches Primer's
 * utilities/getFlag.ts. Returns null if the flag is absent, the flag
 * name itself if present with no value, or the value after `=`.
 *
 * @example getFlag("silent") -> null | "--silent" | "true" (for --silent=true)
 */
export function getFlag(flag: string, prefix = "--"): string | null {
  const fullFlag = `${prefix}${flag.replace(prefix, "")}`;
  const index = process.argv.findIndex((arg) => arg === fullFlag || arg.startsWith(`${fullFlag}=`));
  return index === -1 ? null : process.argv[index].replace(`${fullFlag}=`, "");
}
