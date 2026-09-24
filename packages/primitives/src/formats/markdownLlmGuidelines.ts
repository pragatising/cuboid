import type { FormatFn, FormatFnArguments } from "style-dictionary/types";
import { sortByName } from "style-dictionary/utils";

/**
 * Generates an agent-readable markdown doc from every token's
 * `org.cuboid.llm` extension data (usage + rules). Matches the real,
 * generic engine in Primer's formats/markdownLlmGuidelines.ts —
 * grouping by category, deduplicating identical guidelines, building
 * compact tables — WITHOUT porting Primer's hardcoded GitHub-specific
 * domain knowledge (their SEMANTIC_KEY describes "GitHub Sponsors" and
 * "open/closed/done PR states"; their CATEGORY_INFO names Primer's own
 * component vocabulary like controlKnob/spinner). `CATEGORY_INFO` here
 * is intentionally empty — populate it with cuboid's own real
 * categories/semantics once that vocabulary is authored, not copied
 * from GitHub's product.
 */
interface LlmGuideline {
  name: string;
  category: string;
  description?: string;
  usage?: string[];
  rules?: string;
}

/** Populate with cuboid's own category display names/descriptions as they're authored. */
const CATEGORY_INFO: Record<string, { name: string; description: string }> = {};

function limitUsage(usage: string[]): string[] {
  return usage.length <= 3 ? usage : usage.slice(0, 3);
}

function extractCategory(tokenName: string): string {
  const parts = tokenName.split("-");
  if (parts[0] === "base" && parts[1]) return parts[1];
  return parts[0] || "other";
}

function formatCategoryName(category: string): string {
  if (category in CATEGORY_INFO) return CATEGORY_INFO[category].name;
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function getCategoryDescription(category: string): string | null {
  return category in CATEGORY_INFO ? CATEGORY_INFO[category].description : null;
}

/** Groups tokens with byte-identical guidelines within a category, so identical entries render once. */
function createGuidelineKey(guideline: LlmGuideline): string {
  return JSON.stringify({
    category: guideline.category,
    description: guideline.description || "",
    usage: guideline.usage?.slice().sort() || [],
    rules: guideline.rules || "",
  });
}

function escapeTableCell(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\|/g, "\\|");
}

/**
 * Resolved token tree -> a markdown doc grouped by category, each group
 * showing shared usage/rules once and listing its tokens.
 */
export const markdownLlmGuidelines: FormatFn = async ({ dictionary }: FormatFnArguments) => {
  const tokens = dictionary.allTokens.sort(sortByName);

  const guidelines: LlmGuideline[] = [];

  for (const token of tokens) {
    const llmExt = token.$extensions?.["org.cuboid.llm"] as { usage?: string[]; rules?: string } | undefined;
    if (!llmExt) continue;

    const guideline: LlmGuideline = {
      name: token.name,
      category: extractCategory(token.name),
    };

    if (token.$description && typeof token.$description === "string") {
      guideline.description = token.$description;
    }
    if (llmExt.usage && Array.isArray(llmExt.usage)) {
      guideline.usage = limitUsage(llmExt.usage);
    }
    if (llmExt.rules && typeof llmExt.rules === "string") {
      guideline.rules = llmExt.rules;
    }

    guidelines.push(guideline);
  }

  const grouped: Record<string, LlmGuideline[]> = {};
  for (const guideline of guidelines) {
    if (!Object.hasOwn(grouped, guideline.category)) {
      grouped[guideline.category] = [];
    }
    grouped[guideline.category].push(guideline);
  }

  const lines: string[] = [
    "# Cuboid Design Token Guidelines",
    "",
    "Agent-readable reference for cuboid's design tokens, generated from each token's `org.cuboid.llm` extension.",
    "",
    "## Legend",
    "",
    "- **U:** Use cases",
    "- **R:** Token-specific rules",
    "",
  ];

  for (const category of Object.keys(grouped).sort()) {
    const categoryGuidelines = grouped[category];
    if (categoryGuidelines.length === 0) continue;

    lines.push(`## ${formatCategoryName(category)}`);

    const consolidatedGroups: Map<string, LlmGuideline[]> = new Map();
    for (const guideline of categoryGuidelines) {
      const key = createGuidelineKey(guideline);
      if (!consolidatedGroups.has(key)) {
        consolidatedGroups.set(key, []);
      }
      consolidatedGroups.get(key)!.push(guideline);
    }

    const categoryDesc = getCategoryDescription(category);
    if (categoryDesc) {
      lines.push("");
      lines.push(categoryDesc);
    }
    lines.push("");

    for (const [, guidelinesGroup] of consolidatedGroups) {
      const first = guidelinesGroup[0];
      const tokenNames = guidelinesGroup.map((g) => g.name);

      if (guidelinesGroup.length > 1) {
        if (first.description) {
          lines.push(escapeTableCell(first.description));
        }
        if (first.usage && first.usage.length > 0) {
          lines.push(`**U:** ${first.usage.join(", ")}`);
        }
        if (first.rules) {
          lines.push(`**R:** ${escapeTableCell(first.rules)}`);
        }
        lines.push(`**Tokens:** ${tokenNames.join(", ")}`);
        lines.push("");
      } else {
        lines.push(`### ${first.name}`);
        if (first.description) {
          lines.push(escapeTableCell(first.description));
        }
        if (first.usage && first.usage.length > 0) {
          lines.push(`**U:** ${first.usage.join(", ")}`);
        }
        if (first.rules) {
          lines.push(`**R:** ${escapeTableCell(first.rules)}`);
        }
        lines.push("");
      }
    }
  }

  return lines.join("\n");
};
