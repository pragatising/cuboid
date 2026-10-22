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
- **No `theme` prop, no `ThemeProvider`, no `var(--cube-…)`** for values that come from tokens. Per-instance theming is not supported: theming happens in the consuming app's token build (overrides), and modes are switched globally with `setMode`.
- **CSS modules keep layout only** (display, box-sizing, flex, positioning) — and, for now, pseudo-state rules (`:hover`, `:focus-visible`, `:disabled`) that cannot be written as inline styles. Do not move a *value* into the CSS module as a var just to reach a pseudo-state without discussing it; that is the open question for state-heavy components (Button, Link, …), to be settled on the first one.
- **Prop vocabulary:** props that select a token take the token's own key (`color: "default" | "muted"` → `divider.color.default | muted`), not a path string or a raw CSS colour.

## Refs (React 19)

The package requires React 19 (`peerDependencies`: `react >=19`), where `ref` is an ordinary prop. Components do **not** use `forwardRef`: type the props with `React.ComponentPropsWithRef<"element">` and spread them onto the root (through `mergeProps`) — `ref` goes along. The shared `behavesAsComponent` test checks it. When migrating a component that still uses `forwardRef`, remove it.

## State colours (hover / pressed / disabled / focus)

An inline style cannot express a pseudo-class, and an inline colour would beat a `:hover` rule, so a component with states never sets its colours directly. The convention, for every such component:

1. The component resolves its colours from `useTokens()` and hands them to the CSS as **element-scoped variables** named `--<component>-<property>[-<state>]` (`--button-bg-hover`) using `cssVars()` (`src/utils/cssVars.ts`). The variables are private plumbing between a component and its own CSS module, not a theming API.
2. The CSS module has **one** rule set that reads them: `color: var(--button-fg-rest)`, with `:hover`, `:active`, `:disabled` / `[aria-disabled="true"]` and `:focus-visible` picking the `-hover`, `-pressed` and `-disabled` values and the focus-ring variables. No per-variant rules.
3. Every rule is wrapped in `:where()` (zero specificity) so a consumer's own class can override it.
4. State-free values (size, font, spacing, radius) are set inline directly, like Divider and Text.

The labelled button is **`ButtonBase`** (`components/core/Button/ButtonBase.tsx`; `Button` is a thin wrapper over it): it takes `variant`, `size`, the anatomy (`leadingVisual`, `children`, `trailingVisual`) and the states (`disabled`, `inactive`, `loading`), looks the colours and geometry up from the tokens itself (`buttonStyle.ts`), and owns the variables, focus ring, transition, `as` and `aria-disabled` (looks disabled, stays focusable, ignores clicks). Every part of the anatomy has a `data-component` name. **`IconButton` is not built on it**: it has no label, a square size from `tokens.iconButton`, `selected`/`tooltip`, and its own CSS module and `--icon-button-*` variables, following the same convention. Checked in real Chrome with forced pseudo-states in both modes.

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
3. Strip value-carrying `var(--…)` from the module CSS; keep layout.
4. Check it in Storybook in both modes (toolbar).
5. `npm run type-check` must not gain errors; add the component to this list once done.

## Progress

Per-component status lives in `docs/backlog/react-migration-tracker.md`.
