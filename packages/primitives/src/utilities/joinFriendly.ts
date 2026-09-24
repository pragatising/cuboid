/**
 * Joins a string array into a human-readable list ("a, b, or c"). Matches
 * Primer's utilities/joinFriendly.ts — used in schema error messages to
 * list valid options.
 */
export function joinFriendly(items: string[], lastJoin = "and"): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} ${lastJoin} ${items.slice(-1)}`;
}
