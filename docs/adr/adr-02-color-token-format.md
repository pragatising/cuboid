# ADR-02: Color token value format

**Status:** Approved, Adopted
**Decided:** 2026-09-13

## Decision

Every color token's `$value` is a **plain hex string** (`"#RRGGBB"` or a `{path}` reference to one). Transparency is a **separate top-level `alpha` property** (0–1), never baked into the hex (no `hex8`) and never a structured color-space object.

```json5
{
  danger: { $value: '#e74646', $type: 'color' },
  scrim: { $value: '{base.color.scale.black}', alpha: 0.5, $type: 'color' },
}
```

## Why (condensed from evidence, not restated prose)

- **Not HSL.** HSL's lightness axis doesn't track perceived brightness consistently across hues — editing L by the same amount looks like a different amount of change depending on hue. Verified: Primer's own `adr-008-color-format.md`, "Alternatives → HSL," explicitly rejects it for this reason and cites `HSLuv` (a perceptually-corrected variant) as what they use in their *editing tool* instead — never in the token source file itself.
- **Not RGBA/structured-object in source.** Same ADR: RGBA is "harder to copy between tools" and isn't valid under the W3C token draft; a `colorSpace`/`components` object was never adopted by Primer for source tokens at all — confirmed absent from both `adr-008` and `adr-011-design-token-structure.md`.
- **Why a separate `alpha` field, not `hex8`:** one consistent way to express transparency that works whether `$value` is a literal hex or a `{path}` reference (a reference can't carry an 8th hex digit of its own). Verified: `adr-008`, "Decision" section, stated directly.
- **Correction on record:** an earlier draft of Cuboid's `base/colors/light.json5` used a `{colorSpace: 'hsl', components: [...], hex: '...'}` shape, copied from a Primer *screenshot* without checking the actual ADR. That shape does not appear in any verified Primer source or ADR and does not match Figma's real Variables API (which wants RGBA float, not HSL — see ADR-03). It was reverted.

## What this is not deciding

- Whether tokens are hand-authored or Figma-generated — see [ADR-03](./adr-03-token-authoring-source.md).
- Output format (CSS var, JS constant) — a token stored as hex can still be emitted as `rgb()`, `hsl()`, etc. at build time; this ADR only constrains the *source* `$value`.

## Source

Primer's `contributor-docs/adrs/adr-008-color-format.md` (`primer/primitives`), read and verified directly this session.
