import type { Choice, Domain } from "./domains";

/** One example: a choice for every prop. */
export type Row = {
  picks: Record<string, Choice>;
  /** Why the example exists: what it shows that the ones before it did not. */
  title: string;
  newValues: number;
  newPairs: number;
};

export type Coverage = {
  rows: Row[];
  /** Requirements no row could reach (every way to reach them is invalid). */
  uncovered: string[];
  /** For each requirement, the index of the first row that shows it. */
  firstSeen: Map<string, number>;
};

type Options = {
  /** 1: every value of every prop is shown at least once. 2: also every pair of values of two props. */
  strength: 1 | 2;
  /** Rejects a combination (a partial one included) that cannot be drawn. */
  valid?: (picks: Record<string, Choice>) => boolean;
  /** Whether two props affect each other, so that their pairs are worth showing together. Default: all do. */
  interacts?: (a: string, b: string) => boolean;
};

const MAX_ROWS = 200;

const single = (c: Choice) => c.id;
const pair = (a: Choice, b: Choice) => `${a.id}&${b.id}`;

/** Every requirement a set of picks meets. */
function metBy(picks: Record<string, Choice>, order: string[], strength: 1 | 2, interacts: Options["interacts"]): string[] {
  const chosen = order.map((prop) => picks[prop]).filter((c): c is Choice => !!c && c.required);
  const met = chosen.map(single);
  if (strength === 2)
    for (let i = 0; i < chosen.length; i++)
      for (let j = i + 1; j < chosen.length; j++) if (interacts?.(chosen[i].prop, chosen[j].prop) ?? true) met.push(pair(chosen[i], chosen[j]));
  return met;
}

/**
 * Chooses as few examples as it takes to show everything asked for. The first is the baseline (what the component is when nothing
 * is set). Each next one starts from something not yet shown and fills every other prop with whatever shows the most that is still
 * new, so one example shows many things at once. Nothing is random: the same component always gives the same examples.
 */
export function cover(domains: Domain[], options: Options): Coverage {
  const { strength, valid = () => true, interacts } = options;
  const order = domains.map((d) => d.prop);

  const requirements: { key: string; choices: Choice[] }[] = [];
  const required = domains.map((d) => d.choices.filter((c) => c.required));
  for (const choices of required) for (const c of choices) requirements.push({ key: single(c), choices: [c] });
  if (strength === 2)
    for (let i = 0; i < domains.length; i++)
      for (let j = i + 1; j < domains.length; j++) {
        if (!(interacts?.(domains[i].prop, domains[j].prop) ?? true)) continue;
        for (const a of required[i]) for (const b of required[j]) requirements.push({ key: pair(a, b), choices: [a, b] });
      }

  const left = new Set(requirements.map((r) => r.key));
  const firstSeen = new Map<string, number>();
  const rows: Row[] = [];
  const uncovered: string[] = [];

  const add = (picks: Record<string, Choice>) => {
    const met = metBy(picks, order, strength, interacts);
    const fresh = met.filter((key) => left.has(key));
    for (const key of fresh) {
      left.delete(key);
      firstSeen.set(key, rows.length);
    }
    const title = order
      .map((prop) => picks[prop])
      .filter((c) => c && !c.baseline)
      .map((c) => c.label)
      .join(" · ");
    rows.push({
      picks,
      title: title || "Default",
      newValues: fresh.filter((key) => !key.includes("&")).length,
      newPairs: fresh.filter((key) => key.includes("&")).length,
    });
  };

  const baseline: Record<string, Choice> = {};
  for (const d of domains) baseline[d.prop] = d.choices.find((c) => c.baseline) ?? d.choices[0];
  add(baseline);

  while (left.size > 0 && rows.length < MAX_ROWS) {
    const seed = requirements.find((r) => left.has(r.key));
    if (!seed) break;
    const picks: Record<string, Choice> = {};
    for (const c of seed.choices) picks[c.prop] = c;
    if (!valid(picks)) {
      // Nothing can show this: leave it as a gap rather than loop.
      left.delete(seed.key);
      uncovered.push(seed.key);
      continue;
    }
    for (const domain of domains) {
      if (picks[domain.prop]) continue;
      let best: Choice | undefined;
      let bestGain = -1;
      for (const c of domain.choices) {
        if (!valid({ ...picks, [domain.prop]: c })) continue;
        const gain = metBy({ ...picks, [domain.prop]: c }, order, strength, interacts).filter((key) => left.has(key)).length;
        // On a tie, the baseline: an example says only what it has to.
        if (gain > bestGain || (gain === bestGain && c.baseline && !best?.baseline)) {
          best = c;
          bestGain = gain;
        }
      }
      picks[domain.prop] = best ?? domain.choices.find((c) => c.baseline) ?? domain.choices[0];
    }
    add(picks);
  }

  return { rows: prune(rows, order, strength, interacts, firstSeen), uncovered, firstSeen };
}

/** Drops an example whose every requirement another example also meets, so none is there for nothing. The baseline stays. */
function prune(rows: Row[], order: string[], strength: 1 | 2, interacts: Options["interacts"], firstSeen: Map<string, number>): Row[] {
  const count = new Map<string, number>();
  for (const row of rows) for (const key of new Set(metBy(row.picks, order, strength, interacts))) count.set(key, (count.get(key) ?? 0) + 1);
  const kept = [...rows];
  for (let i = kept.length - 1; i >= 1; i--) {
    const met = [...new Set(metBy(kept[i].picks, order, strength, interacts))];
    if (met.every((key) => (count.get(key) ?? 0) > 1)) {
      for (const key of met) count.set(key, (count.get(key) ?? 0) - 1);
      kept.splice(i, 1);
    }
  }
  // Recount what each surviving example is first to show.
  const seen = new Set<string>();
  firstSeen.clear();
  return kept.map((row, index) => {
    const fresh = [...new Set(metBy(row.picks, order, strength, interacts))].filter((key) => !seen.has(key));
    for (const key of fresh) {
      seen.add(key);
      firstSeen.set(key, index);
    }
    return { ...row, newValues: fresh.filter((key) => !key.includes("&")).length, newPairs: fresh.filter((key) => key.includes("&")).length };
  });
}
