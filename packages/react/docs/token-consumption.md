# Reading tokens in a component (ADR-04)

How a cuboid component gets its colours, sizes and so on. Proven on `Divider`; migrate the rest the same way. Decision record: `docs/adr/adr-04-token-consumption-shape.md`.

## The recipe

```tsx
import { useTokens } from "../../../mode";

export function Divider({ color = "default", style, className }: DividerProps) {
  const { divider } = useTokens();            // resolved tree for the active mode
  return <hr className={...} style={{ backgroundColor: divider.color[color], height: divider.thickness, ...style }} />;
}
```

- **`useTokens()`** returns the fully resolved tree for the current mode (`light` / `dark`). Values are plain strings (`"#efeeea"`, `"0.0625rem"`), already resolved through base → functional → component. Autocomplete and typo errors come from the generated `tokens.d.ts`.
- **Read the component's own token group** (`tokens.divider`, `tokens.button`…). Components must not reach into base or unrelated functional groups.
- **No `theme` prop, no `ThemeProvider`.** Consumers do not write `var(--cube-…)`: they use the typed tree and props. Per-instance theming is not supported: theming happens in the consuming app's token build (overrides), and modes are switched globally with `setMode`. (A component's own CSS module may read the published variables: see "State colours" below, ADR-04's 2026-10-22 and 2026-10-24 amendments.)
- **CSS modules keep layout, and for state-heavy components the state values too** (below). A component with no states reads the typed tree inline (Divider, Text) or takes its values as props (`TileIcon`).
- **Prop vocabulary:** props that select a token take the token's own key (`color: "default" | "muted"` → `divider.color.default | muted`), not a path string or a raw CSS colour.

## Refs (React 19)

The package requires React 19 (`peerDependencies`: `react >=19`), where `ref` is an ordinary prop. Components do **not** use `forwardRef`: type the props with `React.ComponentPropsWithRef<"element">` and spread them onto the root (through `mergeProps`) — `ref` goes along. The shared `behavesAsComponent` test checks it. When migrating a component that still uses `forwardRef`, remove it.

## State colours (hover / pressed / disabled / focus / error / selected)

An inline style cannot express a pseudo-class, and an inline colour would beat a `:hover` rule, so a component with states never sets its colours inline. **Decided 2026-10-22, widened 2026-10-24 (ADR-04 amendments): the component's CSS module reads the variables the token build publishes.**

1. The token build writes `dist/css/theme.css`: every token as `--cube-<path>` (light on `:root`, each other mode under `[data-mode="<mode>"]`). An app loads it once; `setMode()` sets `data-mode` on `<html>`.
2. The component's `.module.css` reads them for colours, sizes and states: `color: var(--cube-button-primary-fgColor-rest)`, with `:hover`, `:active`, `:disabled` / `[aria-disabled="true"]`, `:focus-visible` / `:focus-within` picking the `-hover`, `-pressed`, `-disabled` values. The look is picked by `data-variant`, `data-size`, `data-invalid` and similar attributes. The element carries **no inline style**.
3. Every rule is wrapped in `:where()` (zero specificity) so a consumer's own class can override it.
4. **A test per stylesheet** fails if it reads a `--cube-*` variable missing from the built `theme.css`, and checks that the variables it maps resolve, in both modes, to the same values as the JS tree (`src/test/themeCss.ts`; see `ButtonBase.test.tsx`, `InputText.test.tsx`).
5. **Text colours must pass 4.5:1** on the surface they sit on, in both modes: add the pair to `InputField/fieldContrast.test.ts`. jsdom cannot see contrast, so a real-Chrome sweep (`npm run a11y:sweep`, below) backs it up.
6. State-free values that are design decisions can still be set inline from `useTokens()` (Divider, Text), and a component with no states and no design values of its own needs no token group at all (`TileIcon`, `EmptyState`).

The element-scoped `--<component>-…` variables written with `cssVars()` (and `actionMenuVars`-style helpers) were the earlier convention for state colours. `cssVars()` remains for the rare per-instance dynamic value; do not use it to copy token colours onto an element.

The labelled button is **`ButtonBase`** (`Button` is a thin wrapper over it); **`IconButton`** is its own component with its own CSS module. The form controls (`InputText`, `TextArea`, `Select`, `Autocomplete`) read the `input` tokens through `InputField.module.css` and sit on a shared `size.control` scale: `sm`, `md`, `lg` = 24, 28, 32px, the same as Button and IconButton (ADR-05).

## Polymorphic `as`

A component that lets consumers pick its element takes `as` and is generic over it, using the shared helper so the element's own props and ref are typed from `As`:

```tsx
export type TextProps<As extends React.ElementType = "p"> = PolymorphicProps<As, "p", { size?: TextSize; /* own props */ }>;
export function Text<As extends React.ElementType = "p">({ as, className, ...props }: TextProps<As>) { /* … */ }
```

`<Text as="a" href>` type-checks; `<Text as="span" href>` does not. Own props win over same-named element props (Text's `color` is a token path, not the HTML attribute). Type behaviour is tested in `Component.test-d.tsx` (`expectTypeOf`, plus `@ts-expect-error` for what must not compile).

## Overriding token-set values (decided 2026-10-19)

Values a component takes from tokens (colour, font, weight, thickness…) are set inline, so a consumer's CSS class cannot override them. **The `style` prop is the supported override path** — it is merged after the component's own styles and wins. Props that are not token values (e.g. Text's `whiteSpace`) are plain CSS selected by `data-*` attributes with zero-specificity `:where()` rules, so a consumer class does override those.

## Prop naming (decided 2026-10-19)

Size props use the token keys `sm | md | lg` (shorter to write than `small | medium | large`). Props that select a token take that token's own key. Props that mirror a CSS property use the CSS name **and CSS values** (`whiteSpace`, `flexDirection="row"`, `display="grid"`); where a CSS value is a design decision (colour, radius, spacing, z-index) the prop keeps the CSS name but takes a token (`backgroundColor="canvas.inset"`, `gap="1.5x"`). Spacing accepts the Nx scale (`"1.5x"` = 12px, 1x = 8px, typed from `tokens.size`), the semantic ladder (`"xs"`…`"xxl"`), or `0`.

## Switching modes

`setMode("dark")` / `useMode()` / `getMode()` (exported from the package root). Only mode changes re-render token readers. For SSR call `setMode()` with the request's mode before rendering. In Storybook the toolbar "Mode" control does this (`.storybook/preview.ts`).

## Checklist per component

1. Replace `useTheme` / `theme` prop / `*CssVars` helpers with `useTokens()`.
2. Remove the `theme` prop from the component's props, its stories, and every caller.
3. For a component with states, read the published `--cube-*` variables in its CSS module (no inline style, `:where()`, `data-*` for the look) and add the token-variable test; otherwise keep values typed and inline.
4. Check it in Storybook in both modes (toolbar).
5. `npm run type-check` must not gain errors; add the component to this list once done.

## Progress

Per-component status lives in `docs/backlog/react-migration-tracker.md`.
