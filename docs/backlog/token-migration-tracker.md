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

| Component | Token folder | Status | Notes |
|---|---|---|---|
| ActionMenu | `action-menu/action-menu.json` | Needs rewrite | Old `"value"` format (31 instances), 7 stale `color.*`/`base.color.scale.*` paths. |
| Box | `box/` (empty) | Missing | Folder exists, zero files. |
| Breadcrumb | `breadcrumb/breadcrumb.json` | Needs rewrite | Old format (12), 3 stale paths. |
| Button | `button/{primary.json5,secondary.json,danger.json,ghost.json,rounded.json}` | Needs rewrite | `primary.json5` is DTCG-format but still has 12 stale paths (`base.color.scale.*`, `color.bg/border/fg.*`). The other four variants (`secondary`,`danger`,`ghost`,`rounded`) are still old-format entirely. No shared `size.json5` exists for Button at all — needs one added (see `icon-button/size.json5` for precedent). `rounded.json` is misleadingly named — it's a fifth *color* variant, not a shape/size override. |
| Callout | none | Missing | No token folder. React component exists at `packages/react/src/components/core/Callout/`. |
| CodeBlock | `code-block/code-block.json5` | **Done** | Fixed 2026-09-13 — DTCG format, references `bgColor`/`fgColor`/`display.*` functional tokens, no base-color reach-through. |
| Container | none | Missing | No token folder. React component exists. |
| Divider | none | Missing | No token folder. React component exists. |
| Highlight | `highlight/highlight.json5` | Needs rewrite | `.json5` extension but still old-format (21 instances), 13 stale paths. |
| Icon | `icon/icon.json5` | **Done** | Fixed 2026-09-13 — was referencing nonexistent `{displaySizes.N}`, now correctly aliases `{size.N}` functional tokens. |
| IconButton | `icon-button/{size.json5,ghost.json5,outlined.json5}` | **Done** | Fully rebuilt 2026-09-13 — DTCG format, no `color` wrapper, `default`/`selected` states, all real functional-token paths (`bgColor.informational.*`, `fgColor.neutral.*`, etc.). Shared per-state `shadow.json5` still pending (shadow doesn't vary by variant, only by interaction state — not yet built). |
| Link | `link/link.json` | Needs rewrite | Old format (4), 4 stale paths — small file, quick fix. |
| Overlay | `overlay/overlay.json` | Needs rewrite | Old format (3), 3 stale paths — small file. |
| Pill | `pill/{pill.json,blue,gray,green,indigo,lime,mag,orange,purple,red,teal,yellow}.json` | Needs rewrite | 12 files, all old-format. The 11 color-variant files (24 stale-path instances each) look machine-generated (`generate-pill-shade-tokens.mjs` exists in `scripts/` — likely the generator, not meant to be hand-edited; fix the generator script, not each output file, once this is scoped). |
| Popover | `popover/popover.json5` | Needs rewrite | `.json5` extension, mostly fixed (only 5 old-format lines left), 1 stale path remaining — nearly done, small remaining diff. |
| ResizeHandle | `resize-handle/resize-handle.json` | Needs rewrite | Only 1 old-format line, 0 stale paths — smallest remaining fix in the whole list. |
| Sheet | `sheet/sheet.json` | Needs rewrite | Old format (9), 1 stale path. |
| Sidebar | `sidebar/sidebar.json` | Needs rewrite | Old format (10), 2 stale paths. |
| SiteHeader | `site-header/site-header.json` | Needs rewrite | Old format (11), 2 stale paths. |
| SplitLayout | none | Missing | No token folder. React component exists. |
| Stack | `stack/stack.json5` | **Done** | Rebuilt 2026-09-13 — DTCG format, references `{size.N}` functional tokens (added `size.0` to `display-sizes.json5` to cover the "none" gap/padding case). |
| Table | `table/table.json5` | Needs rewrite | `.json5` extension but fully old-format (14 instances), 5 stale paths. |
| Text | none | Missing | No token folder. React component exists. Likely should share most of its tokens with the `functional/typography/*` layer rather than needing a large component-specific set — scope this one carefully, may be mostly a thin pass-through. |
| Tooltip | `tooltip/tooltip.json5` | Needs rewrite | The component that started this whole audit — `.json5` extension, old-format (10), 3 stale paths including a `background: base.color.scale.gray.13` direct base-token reach-through (the original violation that prompted the "components can't use base tokens" rule check). Also needs a decision on `boxShadow` placement (effect vs. sizes — see conversation, not yet resolved) and whether it should use the new `bgColor.neutral.inverted.*` ramp for its dark chip background. |

## Not a component (utility/internal — not tracked here)

`Input` has a token folder (`input/`, empty) but no matching React component under `components/core/` — either dead scaffolding from before a component was built, or scaffolded ahead of one that hasn't landed yet. Flag for the person who created it before deleting.

---

## Summary counts (as of 2026-09-13)

- **Done:** 4 (CodeBlock, Icon, IconButton, Stack)
- **Needs rewrite:** 15 (ActionMenu, Breadcrumb, Button, Highlight, Link, Overlay, Pill, Popover, ResizeHandle, Sheet, Sidebar, SiteHeader, Table, Tooltip — Pill counts as one line-item but is 12 files)
- **Missing entirely:** 6 (Box, Callout, Container, Divider, SplitLayout, Text)
- **Orphaned (no matching component):** 1 (Input)

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
