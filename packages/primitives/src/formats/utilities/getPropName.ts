/**
 * Returns the right property name for value/type/description depending
 * on whether the tree uses DTCG (`$value`) or legacy (`value`) shape.
 * Matches Primer's formats/utilities/getPropName.ts. Cuboid's token
 * source is always DTCG, but Style Dictionary's own internal dictionary
 * can carry either shape depending on config, so this stays real.
 */
const PROP_NAMES = {
  dtcg: { value: "$value", type: "$type", description: "$description" },
  legacy: { value: "value", type: "type", description: "comment" },
} as const;

export function getPropName(prop: "value" | "type" | "description", usesDtcg?: boolean): string {
  const set = usesDtcg ? "dtcg" : "legacy";
  return PROP_NAMES[set][prop];
}
