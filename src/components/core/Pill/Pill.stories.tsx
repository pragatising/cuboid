import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Title, Primary, Controls, Subtitle } from "@storybook/blocks";
import { Icon } from "../Icon";
import { Stack } from "../Stack";
import { Pill, type PillIntensity, type PillShade } from "./Pill";
import themeOutput from "../../../theme/output/theme.json";

const INTENSITIES: PillIntensity[] = ["extralight", "light", "bold", "extraBold"];
const PILL_SHADES = Object.keys(themeOutput.pillColors).sort() as PillShade[];

function PillIntensityMatrix({ border = false }: { border?: boolean }) {
  return (
    <Stack gap="sm">
      {INTENSITIES.map((intensity) => (
        <Stack key={intensity} direction="horizontal" gap="xs" align="center" wrap>
          <span className="cube-docs-matrix-label">{intensity}</span>
          {PILL_SHADES.map((shade) => (
            <Pill key={shade} shade={shade} intensity={intensity} border={border}>
              {shade}
            </Pill>
          ))}
        </Stack>
      ))}
    </Stack>
  );
}

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
    variant: {
      control: "select",
      options: [
        undefined,
        "caption",
        "bodySmall",
        "bodyMedium",
        "bodyLarge",
      ],
    },
  },
  parameters: {
    layout: "padded",
    docs: {
      page: () => (
        <>
          <Title />
          <Subtitle>
            Colored chip around text — <code>shade</code> ×{" "}
            <code>intensity</code> × <code>border?</code>. Defaults to{" "}
            <code>bodySmall</code> (12px, weight 500), 20px tall, 6px horizontal
            padding — override with <code>variant</code> or{" "}
            <code>theme=&#123;&#123; sizes: &#123; pill: … &#125; &#125;&#125;</code>.
          </Subtitle>

          <div className="cube-docs-sections">
          <div className="cube-docs-section">
            <h3 className="cube-docs-section__title">
              <code>shade</code> × <code>intensity</code> (filled)
            </h3>
            <PillIntensityMatrix />
          </div>

          <div className="cube-docs-section">
            <h3 className="cube-docs-section__title">
              <code>shade</code> × <code>intensity</code> (<code>border</code>)
            </h3>
            <PillIntensityMatrix border />
          </div>

          <div className="cube-docs-section">
            <h3 className="cube-docs-section__title">Tokens &amp; shades</h3>
            <ul className="cube-docs-list">
              <li>
                <strong>Color:</strong> one file per shade under{" "}
                <code>tokens/functional/components/pill/&lt;shade&gt;.json</code>.
              </li>
              <li>
                <strong>Layout:</strong>{" "}
                <code>pill.json</code> → padding, radius, gap from space tokens. Override via{" "}
                <code>theme=&#123;&#123; sizes: &#123; pill: … &#125; &#125;&#125;</code>.
              </li>
              <li>
                <strong>Typography:</strong> defaults to <code>bodySmall</code>{" "}
                (12px, weight 500). Pass <code>variant</code> for other{" "}
                <code>Text</code> sizes.
              </li>
            </ul>
          </div>

          <div className="cube-docs-section">
            <h3 className="cube-docs-section__title">As link</h3>
            <Pill
              href="https://example.com"
              shade="gray"
              intensity="light"
              variant="bodySmall"
              trailingVisual={
                <Icon size="xs">
                  <ExternalIcon />
                </Icon>
              }
            >
              Documentation
            </Pill>
          </div>
          </div>

          <div className="cube-docs-section cube-docs-section--last">
            <Primary />
            <Controls />
          </div>
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
    children: "Pill",
  },
};

export const AllVariantsFilled: Story = {
  name: "All variants (filled)",
  render: () => <PillIntensityMatrix />,
};

export const AllVariantsBordered: Story = {
  name: "All variants (bordered)",
  render: () => <PillIntensityMatrix border />,
};

export const WithBodyMedium: Story = {
  render: () => (
    <Pill variant="bodyMedium" shade="gray" intensity="light" border>
      Larger label
    </Pill>
  ),
};
