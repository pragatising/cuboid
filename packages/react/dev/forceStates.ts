/**
 * Lets the docs shell show a state without a pointer (dev only; it is in the shell's own Vite config, never the library's).
 *
 * Component CSS uses real pseudo-classes (`:hover`, `:active`, `:focus-visible`), which no code can switch on. This rewrites each
 * of them, in place, to also match an attribute: `:hover` becomes `:is(:hover, [data-force~="hover"])`. A preview then asks for
 * a state with `data-force="hover"` on the element, and the component's own rule applies. `:is()` takes the specificity of its
 * most specific argument, and an attribute selector is the same as a pseudo-class, so no rule gets stronger or weaker. This is
 * how Storybook's pseudo-states addon works; no component changes.
 *
 * | pseudo-class                     | attribute            |
 * | `:hover`                         | `data-force~="hover"` |
 * | `:active`                        | `data-force~="press"` |
 * | `:focus-visible`, `:focus-within`| `data-force~="focus"` |
 */
const FORCEABLE = { hover: "hover", active: "press", "focus-visible": "focus", "focus-within": "focus" } as const;
const PATTERN = /:(hover|active|focus-visible|focus-within)(?![\w-])/g;

/** The selector with every forceable pseudo-class also matching its `data-force` attribute. Rewriting twice changes nothing. */
export function forceStatesInSelector(selector: string): string {
  if (selector.includes("data-force")) return selector;
  return selector.replace(PATTERN, (_match, pseudo: keyof typeof FORCEABLE) => `:is(:${pseudo}, [data-force~="${FORCEABLE[pseudo]}"])`);
}

type Rule = { selector: string; parent?: { type: string; name?: string } };

/** The PostCSS plugin. Keyframe selectors (`from`, `50%`) are left alone. */
export function forceStates() {
  return {
    postcssPlugin: "cuboid-force-states",
    Rule(rule: Rule) {
      if (rule.parent?.type === "atrule" && /keyframes$/i.test(rule.parent.name ?? "")) return;
      const next = forceStatesInSelector(rule.selector);
      if (next !== rule.selector) rule.selector = next;
    },
  };
}
forceStates.postcss = true;
