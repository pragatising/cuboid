# W3C Design Tokens Format Module — standard `$type` reference

Source: [Design Tokens Format Module, editor's draft](https://www.designtokens.org/tr/drafts/format/) (Design Tokens Community Group). Status: preview draft, not yet a final recommendation — treat as the best available standard reference, not a frozen spec.

Every leaf token is `{ $value, $type, $description?, $extensions? }`. `$type` determines the shape `$value` must take. A reference (`$value` is a `{path}` string) is valid regardless of `$type` — the type applies once the reference resolves.

## 7 primitive types

| `$type` | `$value` shape |
|---|---|
| `color` | Color object (colorSpace, components, optional hex/alpha) |
| `dimension` | `{ value: number, unit: "px" \| "rem" }` |
| `fontFamily` | String, or array of strings |
| `fontWeight` | Number (1–1000), or a predefined string (`"bold"`, `"light"`, etc.) |
| `duration` | `{ value: number, unit: "ms" \| "s" }` |
| `cubicBezier` | 4-number array `[P1x, P1y, P2x, P2y]` |
| `number` | Plain JSON number |

## 6 composite types (built from the primitives above)

| `$type` | `$value` shape |
|---|---|
| `strokeStyle` | Predefined string, or `{ dashArray, lineCap }` |
| `border` | `{ color, width, style }` |
| `transition` | `{ duration, delay, timingFunction }` |
| `shadow` | One shadow object, or an array of them (layered shadows) |
| `gradient` | Color stops + direction |
| `typography` | Object bundling font family/size/weight/line-height/etc. |

## Notes for cuboid's pipeline

- This is the reference list the pipeline's schemas/transformers/filters are scoped against — not a grep of currently-authored token files, since those are still being written/corrected during the foundation rebuild and are not themselves the spec.
- `strokeStyle` is the one standard type Primer's own implementation does not build a schema/transformer for (confirmed: no `strokeStyleToken.ts`/`strokeStyleValue.ts` in `primer/primitives`) — cuboid can defer it the same way unless a real token needs it.
- The spec is an editor's draft, not a final recommendation — re-check before treating any shape here as permanently fixed if something changes upstream.
