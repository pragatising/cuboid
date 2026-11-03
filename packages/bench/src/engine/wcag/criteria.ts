/**
 * What an axe rule's tags say about WCAG: the success criterion (`wcag143` is 1.4.3), the version it came in (`wcag22aa` is 2.2), and
 * the level (A, AA, AAA), or that it is best practice and not a criterion at all. axe tags every rule it ties to a criterion this way.
 */
export type Level = "A" | "AA" | "AAA" | "best-practice";

export type Criterion = {
  /** `1.4.3`. */
  id: string;
  /** The version of WCAG that added it, from the level tag when there is one. */
  version?: "2.0" | "2.1" | "2.2";
  level: Level;
};

/** `143` is 1.4.3 and `1410` is 1.4.10: the principle and guideline are a digit each, and what is left is the criterion's number. */
export function criterionId(digits: string): string {
  return `${digits[0]}.${digits[1]}.${digits.slice(2)}`;
}

const LEVEL_TAG = /^wcag(2|21|22)(a|aa|aaa)$/;

/** The criteria and the level a rule's tags name. A rule with no level tag is best practice. */
export function readTags(tags: string[]): { criteria: string[]; version?: Criterion["version"]; level: Level } {
  const criteria = tags.filter((tag) => /^wcag\d{3,}$/.test(tag)).map((tag) => criterionId(tag.slice(4)));
  let version: Criterion["version"];
  let level: Level = "best-practice";
  for (const tag of tags) {
    const found = LEVEL_TAG.exec(tag);
    if (!found) continue;
    const here = found[2].toUpperCase() as Level;
    // A rule can carry several (2.0 A and 2.2 AA); the one that asks the most is the one it is held to.
    if (level === "best-practice" || here.length > level.length) {
      level = here;
      version = found[1] === "2" ? "2.0" : found[1] === "21" ? "2.1" : "2.2";
    }
  }
  return { criteria, version, level };
}

/**
 * How serious a failure is, from its level: what a conformance claim at A or AA needs is an error, best practice is guidance, and
 * AAA is beyond what is asked of most products. A check axe could not decide (it needs a person) is an info.
 */
export function severityOf(level: Level, decided = true): "error" | "warning" | "info" {
  if (!decided) return "info";
  return level === "A" || level === "AA" ? "error" : level === "best-practice" ? "warning" : "info";
}
