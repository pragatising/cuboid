
# ADR-07: How to write

**Status:** Approved, Adopted
**Decided:** 2026-10-24

## Decision


### Rule-block order (source order)
- Base/reset styles — element defaults, box model resets
- Structural/layout properties — things that don’t vary (display, position)
- Size variants — [data-size="sm"], [data-size="md"], etc., usually smallest → largest or in a logical scale order
- Visual/semantic variants — [data-variant="primary"], [data-variant="secondary"], etc.
- State modifiers — :hover, :focus, :disabled, [data-state="pressed"]
Compound/override rules — combinations like [data-variant="secondary"][data-size="sm"]

The logic: go from least specific/most structural → most specific/most contextual, so that later rules can cleanly override earlier ones without needing high specificity hacks. This is why your size block comes before variant — size tends to be structural (affects layout/spacing), while variant is cosmetic (affects color), and cosmetic overrides are usually expected to layer on top.

### Declaration order within a rule

Common conventions (pick one, be consistent):

Grouped by purpose: positioning → box model → typography → visual (background/border) → misc
Alphabetical (what stylelint’s order plugin often enforces, since it’s unambiguous and diffable)
Mirrors the token/variable naming — which is what your screenshot shows: --button-bg-rest/hover/pressed/disabled, then --button-fg-*, then --button-border-*, grouped by property family and ordered by state (rest → hover → pressed → disabled) within each family.

That rest → hover → pressed → disabled sequencing is itself a near-universal convention in design systems — it mirrors the interaction lifecycle, so anyone scanning top-to-bottom reads the states in the order a user would actually encounter them.

If you’re defining this for your own design system

#### Structural tokens before cosmetic tokens, and
#### within cosmetic tokens, group by property (bg/fg/border) 
#### then order by interaction state (rest/hover/pressed/disabled/focus). 