# Token migration tracker

Source of truth for which built components have correct DTCG-format, functional-token-only component tokens under `packages/primitives/src/tokens/components/`. Companion to `core-components.md` (which tracks Figma → React component builds) — this tracks React component → token correctness, a separate axis. One file, tracked in git — update it as components move through stages rather than starting a new doc per session.

## How to use this doc

- Scope is `packages/react/src/components/core/*` (the built component list) cross-referenced against `packages/primitives/src/tokens/components/*` (the token folders).
- **Status** values: `Done` (DTCG format, no stale paths, functional tokens only) → `Needs rewrite` (folder exists but has old `"value"` format and/or stale/broken alias paths) → `Missing` (no token folder at all).
- Work happens alphabetically by component name.
- Don't delete a row when it's fixed — flip its status and note the date, so `git blame`/history stays a real record.
- Regenerate the `old`/`dtcg`/`stale` counts with the classification command in Appendix A rather than eyeballing files — extension (`.json` vs `.json5`) alone does NOT indicate correctness; several `.json5` files still had old-format content when audited.

---

## Status by component (alphabetical)

All files below are `.json5`, DTCG-format (`$value`), zero stale `color.bg/border/fg/canvas.*` or `base.color.scale.*` paths — reclassified 2026-10-07 after re-running Appendix A, which now reports `old=0`, `stale=0` on every file in the folder.

| Component | Token folder | Status | Notes |
|---|---|---|---|
| ActionMenu | `action-menu/action-menu.json5` | **Done** | |
| Box | `box/box.json5` | **Done (intentionally empty)** | No component-specific values — Box resolves directly against existing functional tokens. File documents a real naming mismatch: prop type uses `sm\|md\|lg\|xl\|full`, `functional/size/radius.json5` uses `xSmall\|small\|medium\|large\|xlarge\|full`. Needs reconciling (rename one side), not new tokens. |
| Breadcrumb | `breadcrumb/breadcrumb.json5` | **Done** | |
| Button | `button/{primary,secondary,danger,ghost,rounded}.json5` | **Done** | All 5 variants DTCG. No shared `size.json5` exists yet (unlike IconButton's precedent) — worth adding if size varies by variant. `rounded.json5` is a 5th *color* variant, not a shape/size override — naming worth revisiting. |
| Callout | `callout/callout.json5` | **Done** | |
| CodeBlock | `code-block/code-block.json5` | **Done** | DTCG format, references `bgColor`/`fgColor`/`display.*` functional tokens, no base-color reach-through. |
| Container | `container/container.json5` | **Done** | |
| Divider | `divider/divider.json5` | **Done** | |
| Heading | `heading/heading.json5` | **Done** | No matching `components/core/Heading` in `packages/react` yet — token-ahead-of-component, or a subcomponent of Text. |
| Highlight | `highlight/{color,size}.json5` | **Done** | |
| Icon | `icon/icon.json5` | **Done** | Aliases `{size.N}` functional tokens. |
| IconButton | `icon-button/{size,ghost,outlined}.json5` | **Done** | `default`/`selected` states, real functional-token paths. Shared per-state `shadow.json5` still flagged as not yet built (shadow varies by interaction state only, not by variant). |
| InlineCodeSnippet | `inline-code-snippet/inline-code-snippet.json5` | **Done** | No matching `components/core/InlineCodeSnippet` in `packages/react` yet. |
| Link | `link/link.json5` | **Done** | |
| Overlay | `overlay/overlay.json5` | **Done** | |
| Pill | `pill/{pill,blue,gray,green,indigo,lime,mag,orange,purple,red,teal,yellow}.json5` | **Done** | 12 files, all DTCG. Generator script (`scripts/generate-pill-shade-tokens.mjs`) fixed in step with the output files — casing bug (`extralight` → `extraLight`) also fixed 2026-10-07. |
| Popover | `popover/popover.json5` | **Done** | |
| ResizeHandle | `resize-handle/resize-handle.json5` | **Done** | |
| Sheet | `sheet/sheet.json5` | **Done** | |
| Sidebar | `sidebar/sidebar.json5` | **Done** | |
| SiteHeader | `site-header/site-header.json5` | **Done** | |
| SplitLayout | `split-layout/split-layout.json5` | **Done (intentionally empty)** | Purely structural flex mechanics (display, align-items, flex, min-width/height) — no color/spacing/radius values exist on the component today. Revisit only if a themeable gap or sidebar width is added. |
| Stack | `stack/stack.json5` | **Done** | References `{size.N}` functional tokens (`size.0` added to cover the "none" gap/padding case). |
| Subtitle | `subtitle/subtitle.json5` | **Done** | No matching `components/core/Subtitle` in `packages/react` yet — likely a Text/Heading subcomponent. |
| Table | `table/table.json5` | **Done** | |
| Text | `text/text.json5` | **Done** | |
| Tooltip | `tooltip/tooltip.json5` | **Done** | The component that started this whole audit — original `background: base.color.scale.gray.13` direct base-token reach-through is gone; now resolves through functional tokens. |

## Not a component (utility/internal — not tracked here)

- `Input` token folder referenced in the prior version of this doc (2026-09-13) no longer exists under `packages/primitives/src/tokens/components/` — resolved (removed) since then.
- `Heading`, `InlineCodeSnippet`, `Subtitle` have token folders with real content but **no matching React component** under `packages/react/src/components/core/` yet — tokens were authored ahead of the component, or they're subcomponents of Text that don't get their own top-level folder. Worth confirming intent before the React build-out phase starts.

---

## Summary counts (as of 2026-10-07, re-audited via Appendix A)

- **Done:** 26 of 26 component token folders — every file is DTCG-format with zero stale legacy-path references.
- **Needs rewrite:** 0
- **Missing entirely:** 0
- **Intentionally empty (documented, not a gap):** 2 (Box, SplitLayout)
- **Tokens authored ahead of their React component:** 3 (Heading, InlineCodeSnippet, Subtitle) — confirm these are real/intended before building their components.

**This doc's job is now done for the "is it DTCG and functional-only" axis** — every component token folder passes. Remaining primitives-side work lives in `primitives-pipeline-tracker.md` (Zod schema wiring, typed output) rather than here. Keep this file as the permanent record; re-run Appendix A if new component token files are added.

## Appendix A — classification command

Re-run this to regenerate the old/dtcg/stale counts referenced above (from `packages/primitives/src/tokens/components/`):

```sh
find . -maxdepth 2 -type f \( -name "*.json" -o -name "*.json5" \) | sort | while read -r f; do
  old_value=$(grep -c '"value"' "$f" 2>/dev/null)
  dtcg_value=$(grep -c '\$value' "$f" 2>/dev/null)
  stale_path=$(grep -cE 'color\.(bg|border|fg|canvas)\.|base\.color\.scale\.' "$f" 2>/dev/null)
  printf "%-50s old=%-4s dtcg=%-4s stale=%-4s\n" "$f" "$old_value" "$dtcg_value" "$stale_path"
done
```

`old` = pre-DTCG `"value"` keys still present. `dtcg` = `$value` keys present (extension alone is not reliable evidence — check this count). `stale` = references to path prefixes that don't exist post-refactor (`color.bg.*`, `color.border.*`, `color.fg.*`, `color.canvas.*`, `base.color.scale.*` — the real prefixes are `bgColor.*`, `borderColor.*`, `fgColor.*`, `base.color.*` with no `.scale.` level).
