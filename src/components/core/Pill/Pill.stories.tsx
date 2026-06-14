import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Title, Primary, Controls, Subtitle } from "@storybook/blocks";
import { Stack } from "../Stack";
import { Icon } from "../Icon";
import { Pill, type PillIntensity, type PillShade } from "./Pill";
import themeOutput from "../../../theme/output/theme.json";

const INTENSITIES: PillIntensity[] = ["extralight", "light", "bold", "extraBold"];
const PILL_SHADES = Object.keys(themeOutput.pillColors).sort() as PillShade[];

const ExternalIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden focusable={false}>
    <path d="M3.75 3.5a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-4a.75.75 0 0 1 1.5 0v4A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25v-8.5C2 2.784 2.784 2 3.75 2h4a.75.75 0 0 1 0 1.5h-4Z" />
    <path d="M12.5 2a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-1.5 0V3.56L9.78 8.03a.75.75 0 0 1-1.06-1.06l4.47-4.47H13a.75.75 0 0 1-.5-1.5Z" />
  </svg>
);

const meta: Meta<typeof Pill> = {
  title: "Core/Pill",
  component: Pill,
  tags: ["autodocs"],
  argTypes: {
    shade: { control: "select", options: PILL_SHADES },
    intensity: { control: "select", options: INTENSITIES },
    border: { control: "boolean" },
    size: { control: "radio", options: ["sm", "md"] },
  },
  parameters: {
    layout: "padded",
    docs: {
      page: () => (
        <>
          <Title />
          <Subtitle>
            Maps to Figma Pill: <code>shade</code> ×{" "}
            <code>intensity</code> ×{" "}
            <code>border?</code>. Shades come from{" "}
            <code>tokens/functional/components/pill/&lt;shade&gt;.json</code>.
          </Subtitle>

          <div className="cube-docs-section">
            <h3 className="cube-docs-section__title">Tokens &amp; shades</h3>
            <ul className="cube-docs-list">
              <li>
                <strong>API:</strong>{" "}
                <code>shade</code> ×{" "}
                <code>intensity</code> ×{" "}
                <code>border?</code> — maps to Figma Pill props.
              </li>
              <li>
                <strong>Color tokens:</strong> one file per shade under{" "}
                <code>tokens/functional/components/pill/&lt;shade&gt;.json</code>{" "}
                (e.g. <code>gray.json</code>,{" "}
                <code>yellow.json</code>). Path:{" "}
                <code>
                  color.pill.&lt;shade&gt;.&lt;intensity&gt;.&lt;filled|bordered&gt;.bgColor|borderColor|fgColor
                </code>
                .
              </li>
              <li>
                <strong>Layout tokens:</strong>{" "}
                <code>pill.json</code> → sizes{" "}
                <code>sm</code> / <code>md</code>{" "}
                (padding, radius, gap only).
              </li>
              <li>
                <strong>Typography:</strong>{" "}
                <code>typography.pill.sm|md</code> in{" "}
                <code>tokens/functional/typography/typography.json</code>{" "}
                — not in <code>pill.json</code>.
              </li>
              <li>
                <strong>Storybook shade control:</strong> options are derived from{" "}
                <code>pillColors</code> keys in{" "}
                <code>theme.json</code> after build — add a shade file,
                then run <code>npm run tokens:theme</code>.
              </li>
              <li>
                <strong>Scaffold new hues:</strong>{" "}
                <code>node scripts/generate-pill-shade-tokens.mjs</code>{" "}
                writes yellow/green/teal/orange/red from{" "}
                <code>color.fg.*</code> +{" "}
                <code>base.color.scale.*</code>.{" "}
                <code>gray.json</code> is hand-authored (Figma source of truth);
                sync other shades to Figma when values differ.
              </li>
            </ul>
          </div>

          <div className="cube-docs-section">
            <h3 className="cube-docs-section__title">Shades (light, filled)</h3>
            <Stack direction="horizontal" gap="xs" wrap>
              {PILL_SHADES.map((shade) => (
                <Pill key={shade} shade={shade} intensity="light">
                  {shade}
                </Pill>
              ))}
            </Stack>
          </div>

          <div className="cube-docs-section">
            <h3 className="cube-docs-section__title">Gray × intensity (filled)</h3>
            <Stack direction="horizontal" gap="xs" wrap>
              {INTENSITIES.map((intensity) => (
                <Pill key={intensity} shade="gray" intensity={intensity}>
                  {intensity}
                </Pill>
              ))}
            </Stack>
          </div>

          <div className="cube-docs-section">
            <h3 className="cube-docs-section__title">Gray × intensity (bordered)</h3>
            <Stack direction="horizontal" gap="xs" wrap>
              {INTENSITIES.map((intensity) => (
                <Pill key={intensity} shade="gray" intensity={intensity} border>
                  {intensity}
                </Pill>
              ))}
            </Stack>
          </div>

          <div className="cube-docs-section">
            <h3 className="cube-docs-section__title">Sizes</h3>
            <Stack direction="horizontal" gap="xs" align="center">
              <Pill size="sm">sm</Pill>
              <Pill size="md">md</Pill>
            </Stack>
          </div>

          <div className="cube-docs-section">
            <h3 className="cube-docs-section__title">As link</h3>
            <Pill
              href="https://example.com"
              shade="gray"
              intensity="light"
              size="md"
              trailingVisual={
                <Icon size="xs">
                  <ExternalIcon />
                </Icon>
              }
            >
              Documentation
            </Pill>
          </div>

          <Primary />
          <Controls />
        </>
      ),
    },
  },
};
export default meta;
type Story = StoryObj<typeof Pill>;

export const Playground: Story = {
  args: {
    shade: "gray",
    intensity: "light",
    border: false,
    size: "sm",
    children: "Pill",
  },
};
