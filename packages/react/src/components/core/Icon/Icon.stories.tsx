import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Title, Primary, Controls, Subtitle } from "@storybook/blocks";
import type { IconName } from "@sragatiping/cuboid-primitives/icons/names";
import manifest from "@sragatiping/cuboid-primitives/icons/manifest.json";
import { CodeBlock } from "../../CodeBlock/CodeBlock";
import { Box } from "../Box";
import { Text } from "../Text";
import { Icon, type IconSize } from "./Icon";

type ManifestEntry = { name: IconName; category: string; filled: boolean };
const MANIFEST_ENTRIES = Object.entries(manifest) as [string, ManifestEntry][];

const BASIC_USAGE_SAMPLE = `import { Icon } from "@sragatiping/cuboid";

<Icon name="account_circle" />
<Icon name="account_circle" size="lg" />
<Icon name="warning" color="warning.strong" />`;

const AXES_OVERRIDE_SAMPLE = `// Defaults: weight 400, grade 0, optical size 24, outline.
<Icon name="favorite" weight={600} grade={-25} fill />`;

const MIGRATION_SAMPLE = `// Before: fixed-weight SVG import per glyph, one per weight/fill
import { AccountCircle } from "../../icons/material";
<Icon><AccountCircle /></Icon>

// After: canonical name, axes set by props
<Icon name="account_circle" />`;

const meta: Meta<typeof Icon> = {
  title: "Core/Icon",
  component: Icon,
  tags: ["autodocs"],
  argTypes: {
    // `color` is a fgColor token path (e.g. "success.strong"), not a literal
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
            glyphs come from the Material Symbols font (rounded, weight 400 by default). Color
            inherits via <code>currentColor</code> unless an <code>fgColor</code> token path is
            passed. Sizes map to <code>tokens.icon.*</code> (<code>xs</code> 16px, <code>sm</code> 18px,{" "}
            <code>md</code> 20px, <code>lg</code> 24px).
          </Subtitle>

          <div className="cube-docs-sections">
            <div className="cube-docs-section cube-docs-section--wide">
              <h3 className="cube-docs-section__title">Basic usage</h3>
              <p className="cube-docs-note">
                <code>name</code> is the only required prop — a canonical Material Symbols glyph
                name (e.g. <code>account_circle</code>), typed as <code>IconName</code> for
                autocomplete. Everything else (size, color, weight/grade/opticalSize/fill) is
                optional.
              </p>
              <CodeBlock code={BASIC_USAGE_SAMPLE} language="tsx" />
            </div>

            <div className="cube-docs-section cube-docs-section--wide">
              <h3 className="cube-docs-section__title">Sizes</h3>
              <Box flexDirection="row" gap="sm" alignItems="center">
                {(["xs", "sm", "md", "lg"] as IconSize[]).map((size) => (
                  <Box key={size} gap="xxs" alignItems="center">
                    <Icon name="chevron_right" size={size} />
                    <span className="cube-docs-caption">{size}</span>
                  </Box>
                ))}
              </Box>
            </div>

            <div className="cube-docs-section cube-docs-section--wide">
              <h3 className="cube-docs-section__title">Variable axes: weight, grade, optical size, fill</h3>
              <p className="cube-docs-note">
                Material Symbols exposes four continuous axes. <code>Icon</code> exposes each as a
                prop with a sensible default — see the{" "}
                <em>Weight axis</em>, <em>Fill</em>, and <em>Playground</em> stories below for live
                examples.
              </p>
              <CodeBlock code={AXES_OVERRIDE_SAMPLE} language="tsx" />
            </div>

            <div className="cube-docs-section cube-docs-section--wide">
              <h3 className="cube-docs-section__title">Color</h3>
              <p className="cube-docs-note">
                <code>color</code> takes an <code>fgColor</code> token path (e.g.{" "}
                <code>success.strong</code>), the same convention as <code>Text</code>'s{" "}
                <code>color</code> prop. Applied as{" "}
                <code>currentColor</code>, so the glyph always inherits it; omit it to inherit
                ambient text color instead. See the <em>Color</em> story below.
              </p>
            </div>

            <div className="cube-docs-section cube-docs-section--wide">
              <h3 className="cube-docs-section__title">Migrating from the old API</h3>
              <p className="cube-docs-note">
                <code>Icon</code> used to take a rendered SVG element as <code>children</code>,
                and each glyph/weight was a separate generated import from{" "}
                <code>icons/material</code>. That pipeline is gone — pass the canonical name
                instead:
              </p>
              <CodeBlock code={MIGRATION_SAMPLE} language="tsx" />
            </div>

            <div className="cube-docs-section cube-docs-section--wide cube-docs-section--last">
              <h3 className="cube-docs-section__title">Finding a glyph name</h3>
              <p className="cube-docs-note">
                Any of the ~3,900 names in Material Symbols&apos; own manifest works as{" "}
                <code>name</code>. <code>packages/primitives/icons/manifest.json</code> is Cube&apos;s curated
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
    <Box flexDirection="row" gap="lg" alignItems="center">
      {[100, 300, 400, 500, 700].map((weight) => (
        <Box key={weight} gap="xxs" alignItems="center">
          <Icon name="favorite" size="lg" weight={weight} />
          <Text size="sm" color="neutral.muted">
            {weight}
          </Text>
        </Box>
      ))}
    </Box>
  ),
};

export const FillAxis: Story = {
  name: "Fill (outline vs filled)",
  render: () => (
    <Box flexDirection="row" gap="lg" alignItems="center">
      <Box gap="xxs" alignItems="center">
        <Icon name="favorite" size="lg" fill={false} />
        <Text size="sm" color="neutral.muted">
          fill=false
        </Text>
      </Box>
      <Box gap="xxs" alignItems="center">
        <Icon name="favorite" size="lg" fill />
        <Text size="sm" color="neutral.muted">
          fill=true
        </Text>
      </Box>
    </Box>
  ),
};

export const ColorToken: Story = {
  name: "Color (fgColor token path)",
  render: () => (
    <Box flexDirection="row" gap="lg" alignItems="center">
      <Icon name="check_circle" size="lg" color="success.strong" />
      <Icon name="warning" size="lg" color="warning.strong" />
      <Icon name="cancel" size="lg" color="error.strong" />
    </Box>
  ),
};

/**
 * Every Figma-mapped glyph name — browse here to find a `name` to pass to `Icon`.
 * Any of the ~3,900 names in Material Symbols' own manifest also works; this
 * catalog is only the subset cross-referenced against Figma (`packages/primitives/icons/manifest.json`).
 */
export const Catalog: Story = {
  render: () => (
    <Box gap="lg">
      {MANIFEST_ENTRIES.map(([figmaName, entry]) => (
        <Box key={figmaName} flexDirection="row" gap="md" alignItems="center">
          <Icon name={entry.name} size="md" fill={entry.filled} />
          <Box gap="xxs">
            <Text size="md">
              {entry.name}
              {entry.filled ? " (fill)" : ""}
            </Text>
            <Text size="sm" color="neutral.muted">
              {figmaName} · {entry.category}
            </Text>
          </Box>
        </Box>
      ))}
    </Box>
  ),
};
