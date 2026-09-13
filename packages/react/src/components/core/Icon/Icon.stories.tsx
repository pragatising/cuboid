import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Title, Primary, Controls, Subtitle } from "@storybook/blocks";
import { ThemeProvider } from "../../../theme/ThemeContext";
import type { IconAxes, IconLibrary } from "../../../icons/IconLibrary";
import type { IconName } from "../../../icons/material/iconNames.generated";
import manifest from "../../../icons/manifest.json";
import { CodeBlock } from "../../CodeBlock/CodeBlock";
import { Stack } from "../Stack";
import { Text } from "../Text";
import { Icon, type IconSize } from "./Icon";

type ManifestEntry = { name: IconName; category: string; filled: boolean };
const MANIFEST_ENTRIES = Object.entries(manifest) as [string, ManifestEntry][];

const BASIC_USAGE_SAMPLE = `import { Icon } from "@sragatiping/cuboid";

<Icon name="account_circle" />
<Icon name="account_circle" size="lg" />
<Icon name="warning" color="global.warning.default" />`;

const AXES_OVERRIDE_SAMPLE = `// Per-call overrides win over the theme's icon defaults.
<Icon name="favorite" weight={600} grade={-25} fill />`;

const THEME_DEFAULTS_SAMPLE = `// Set once — every <Icon /> in the subtree picks it up.
import { ThemeProvider } from "@sragatiping/cuboid";

<ThemeProvider
  theme={{
    icon: {
      weight: 500,
      grade: 0,
      opticalSize: 24,
      fill: false,
      style: "rounded",
    },
  }}
>
  <App />
</ThemeProvider>`;

const LIBRARY_INTERFACE_SAMPLE = `export interface IconAxes {
  weight: number;       // 100–700
  grade: number;        // -25 to 200
  opticalSize: number;  // 20–48
  fill: boolean;
  style: "outlined" | "rounded" | "sharp";
}

export interface IconLibrary {
  resolve(name: IconName, axes: IconAxes): React.ReactElement;
}`;

const LIBRARY_SWAP_SAMPLE = `// Swap the library once, in theme config — call sites never change.
import { ThemeProvider } from "@sragatiping/cuboid";
import { myIconLibrary } from "./myIconLibrary";

<ThemeProvider theme={{ icon: { library: myIconLibrary } }}>
  <App />
</ThemeProvider>

// Every <Icon name="account_circle" /> in the subtree now
// resolves through myIconLibrary instead of Material Symbols.`;

const MIGRATION_SAMPLE = `// Before — fixed-weight SVG import per glyph, one per weight/fill
import { AccountCircle } from "../../icons/material";
<Icon><AccountCircle /></Icon>

// After — canonical name, axes resolved by the active IconLibrary
<Icon name="account_circle" />`;

const meta: Meta<typeof Icon> = {
  title: "Core/Icon",
  component: Icon,
  tags: ["autodocs"],
  argTypes: {
    // `color` is a global-token dot-path (e.g. "global.success.default"), not a literal
    // color — without this, the project's `controls.matchers.color` regex assigns the
    // color-swatch control to any prop named `color`/`background`.
    color: { control: "text" },
  },
  parameters: {
    layout: "padded",
    docs: {
      page: () => (
        <>
          <Title />
          <Subtitle>
            Pass a canonical glyph name — <code>{'<Icon name="account_circle" />'}</code>. The
            actual icon library (Material Symbols by default) and its default weight / grade /
            optical size / fill / style axes are configured once via{" "}
            <code>ThemeProvider theme={"{ icon: {...} }"}</code>, not per call. Color inherits via{" "}
            <code>currentColor</code> unless a <code>color</code> token path is passed. Sizes map
            to <code>sizes.icon.*</code> (<code>xs</code> 16px, <code>sm</code> 18px,{" "}
            <code>md</code> 20px, <code>lg</code> 24px).
          </Subtitle>

          <div className="cube-docs-sections">
            <div className="cube-docs-section cube-docs-section--wide">
              <h3 className="cube-docs-section__title">Basic usage</h3>
              <p className="cube-docs-note">
                <code>name</code> is the only required prop — a canonical Material Symbols glyph
                name (e.g. <code>account_circle</code>), typed as <code>IconName</code> for
                autocomplete. Everything else (size, color, weight/grade/opticalSize/fill) is
                optional and falls back to theme defaults.
              </p>
              <CodeBlock code={BASIC_USAGE_SAMPLE} language="tsx" />
            </div>

            <div className="cube-docs-section cube-docs-section--wide">
              <h3 className="cube-docs-section__title">Sizes</h3>
              <Stack direction="horizontal" gap="sm" align="center">
                {(["xs", "sm", "md", "lg"] as IconSize[]).map((size) => (
                  <Stack key={size} gap="xxs" align="center">
                    <Icon name="chevron_right" size={size} />
                    <span className="cube-docs-caption">{size}</span>
                  </Stack>
                ))}
              </Stack>
            </div>

            <div className="cube-docs-section cube-docs-section--wide">
              <h3 className="cube-docs-section__title">Variable axes: weight, grade, optical size, fill</h3>
              <p className="cube-docs-note">
                Material Symbols exposes four continuous axes. <code>Icon</code> exposes each as a
                prop that overrides the theme default for that one call — see the{" "}
                <em>Weight axis</em>, <em>Fill</em>, and <em>Playground</em> stories below for live
                examples.
              </p>
              <CodeBlock code={AXES_OVERRIDE_SAMPLE} language="tsx" />
            </div>

            <div className="cube-docs-section cube-docs-section--wide">
              <h3 className="cube-docs-section__title">Configure defaults once, via theme</h3>
              <p className="cube-docs-note">
                Don't repeat <code>weight</code>/<code>grade</code>/<code>opticalSize</code>/
                <code>fill</code>/<code>style</code> at every call site. Set them once on{" "}
                <code>ThemeProvider</code> and every <code>Icon</code> in the subtree inherits
                them; a per-call prop still wins when passed.
              </p>
              <CodeBlock code={THEME_DEFAULTS_SAMPLE} language="tsx" />
            </div>

            <div className="cube-docs-section cube-docs-section--wide">
              <h3 className="cube-docs-section__title">Color</h3>
              <p className="cube-docs-note">
                <code>color</code> takes a global-token dot-path (e.g.{" "}
                <code>global.success.default</code>) resolved against{" "}
                <code>theme.colors.global</code> — same convention as <code>Text</code>'s{" "}
                <code>color</code> prop — or a raw CSS color string. Applied as{" "}
                <code>currentColor</code>, so the glyph always inherits it; omit it to inherit
                ambient text color instead. See the <em>Color</em> story below.
              </p>
            </div>

            <div className="cube-docs-section cube-docs-section--wide">
              <h3 className="cube-docs-section__title">Swapping the icon library</h3>
              <p className="cube-docs-note">
                <code>Icon</code> never talks to Material Symbols directly — it calls{" "}
                <code>theme.icon.library.resolve(name, axes)</code>. Any object implementing this
                interface can replace the default:
              </p>
              <CodeBlock code={LIBRARY_INTERFACE_SAMPLE} language="tsx" />
              <p className="cube-docs-note" style={{ marginTop: "var(--cube-stack-gap-sm)" }}>
                Swap it at the theme level — call sites keep using the same{" "}
                <code>name</code> strings unchanged:
              </p>
              <CodeBlock code={LIBRARY_SWAP_SAMPLE} language="tsx" />
              <p className="cube-docs-note" style={{ marginTop: "var(--cube-stack-gap-sm)" }}>
                See the <em>Theme-level library override</em> story below for a working example
                (a stand-in library, swapped live via <code>ThemeProvider</code>).
              </p>
            </div>

            <div className="cube-docs-section cube-docs-section--wide">
              <h3 className="cube-docs-section__title">Migrating from the old API</h3>
              <p className="cube-docs-note">
                <code>Icon</code> used to take a rendered SVG element as <code>children</code>,
                and each glyph/weight was a separate generated import from{" "}
                <code>icons/material</code>. That pipeline is gone — pass the canonical name
                instead and let the active <code>IconLibrary</code> resolve it:
              </p>
              <CodeBlock code={MIGRATION_SAMPLE} language="tsx" />
            </div>

            <div className="cube-docs-section cube-docs-section--wide cube-docs-section--last">
              <h3 className="cube-docs-section__title">Finding a glyph name</h3>
              <p className="cube-docs-note">
                Any of the ~3,900 names in Material Symbols&apos; own manifest works as{" "}
                <code>name</code>. <code>src/icons/manifest.json</code> is Cube&apos;s curated
                Figma → Material cross-reference — the subset also used in Figma designs — browsable
                in the <em>Catalog</em> story below.
              </p>
            </div>
          </div>

          <Primary />
          <Controls />
        </>
      ),
    },
  },
};
export default meta;
type Story = StoryObj<typeof Icon>;

export const Playground: Story = {
  args: {
    name: "account_circle",
    size: "md",
    weight: 400,
    grade: 0,
    opticalSize: 24,
    fill: false,
  },
  argTypes: {
    size: { control: "radio", options: ["xs", "sm", "md", "lg"] },
    weight: { control: { type: "range", min: 100, max: 700, step: 10 } },
    grade: { control: { type: "range", min: -25, max: 200, step: 5 } },
    opticalSize: { control: { type: "range", min: 20, max: 48, step: 1 } },
    fill: { control: "boolean" },
    color: { control: "text" },
  },
};

export const WeightAxis: Story = {
  name: "Weight axis (100–700)",
  render: () => (
    <Stack direction="horizontal" gap="lg" align="center">
      {[100, 300, 400, 500, 700].map((weight) => (
        <Stack key={weight} gap="xxs" align="center">
          <Icon name="favorite" size="lg" weight={weight} />
          <Text role="body" size="xs" color="muted">
            {weight}
          </Text>
        </Stack>
      ))}
    </Stack>
  ),
};

export const FillAxis: Story = {
  name: "Fill (outline vs filled)",
  render: () => (
    <Stack direction="horizontal" gap="lg" align="center">
      <Stack gap="xxs" align="center">
        <Icon name="favorite" size="lg" fill={false} />
        <Text role="body" size="xs" color="muted">
          fill=false
        </Text>
      </Stack>
      <Stack gap="xxs" align="center">
        <Icon name="favorite" size="lg" fill />
        <Text role="body" size="xs" color="muted">
          fill=true
        </Text>
      </Stack>
    </Stack>
  ),
};

export const ColorToken: Story = {
  name: "Color (global token path)",
  render: () => (
    <Stack direction="horizontal" gap="lg" align="center">
      <Icon name="check_circle" size="lg" color="global.success.default" />
      <Icon name="warning" size="lg" color="global.warning.default" />
      <Icon name="cancel" size="lg" color="global.error.default" />
    </Stack>
  ),
};

/**
 * Stand-in `IconLibrary` proving the interface is swappable at the theme level.
 * Renders a colored circle with the glyph's first letter instead of a real
 * Material Symbols glyph — not a production adapter, just proof the contract
 * (`resolve(name, axes) => ReactElement`) is all `Icon` depends on.
 */
const stubIconLibrary: IconLibrary = {
  resolve(name: IconName, axes: IconAxes) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "1em",
          height: "1em",
          fontSize: "1em",
          borderRadius: "999px",
          border: "0.08em solid currentColor",
          fontWeight: axes.weight >= 500 ? 700 : 400,
          fontStyle: axes.fill ? "normal" : "italic",
          textTransform: "uppercase",
          lineHeight: 1,
        }}
      >
        {name.charAt(0)}
      </span>
    );
  },
};

export const ThemeLibraryOverride: Story = {
  name: "Theme-level library override",
  render: () => (
    <Stack gap="md">
      <Text role="body" size="xs" color="muted">
        Same <code>name</code> prop, swapped <code>theme.icon.library</code> — call sites never
        change when the icon library changes.
      </Text>
      <Stack direction="horizontal" gap="lg" align="center">
        <Stack gap="xxs" align="center">
          <Icon name="account_circle" size="lg" />
          <Text role="body" size="xs" color="muted">
            default (Material Symbols)
          </Text>
        </Stack>
        <ThemeProvider theme={{ icon: { library: stubIconLibrary } }}>
          <Stack gap="xxs" align="center">
            <Icon name="account_circle" size="lg" />
            <Text role="body" size="xs" color="muted">
              stub library
            </Text>
          </Stack>
        </ThemeProvider>
      </Stack>
    </Stack>
  ),
};

/**
 * Every Figma-mapped glyph name — browse here to find a `name` to pass to `Icon`.
 * Any of the ~3,900 names in Material Symbols' own manifest also works; this
 * catalog is only the subset cross-referenced against Figma (`icons/manifest.json`).
 */
export const Catalog: Story = {
  render: () => (
    <Stack gap="lg">
      {MANIFEST_ENTRIES.map(([figmaName, entry]) => (
        <Stack key={figmaName} direction="horizontal" gap="md" align="center">
          <Icon name={entry.name} size="md" fill={entry.filled} />
          <Stack gap="xxs">
            <Text role="body" size="sm">
              {entry.name}
              {entry.filled ? " (fill)" : ""}
            </Text>
            <Text role="body" size="xs" color="muted">
              {figmaName} · {entry.category}
            </Text>
          </Stack>
        </Stack>
      ))}
    </Stack>
  ),
};
