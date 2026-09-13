import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Title, Primary, Controls, Subtitle } from "@storybook/blocks";
import { Stack } from "../Stack";
import { Icon } from "../Icon";
import { Pill, type PillIntensity, type PillShade } from "./Pill";
import { tokenOutput } from "../../../theme/tokenOutput";

const INTENSITIES: PillIntensity[] = ["extralight", "light", "bold", "extraBold"];
const PILL_SHADES = Object.keys(tokenOutput.pillColors).sort() as PillShade[];

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
      options: [undefined, "bodyXs", "bodySm", "bodyMd"],
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
            <code>bodyXs</code> (12px, weight 500), 20px tall, 6px horizontal
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
                <code>pill.json</code> → padding, radius, gap from space tokens. Override the
                whole recipe via{" "}
                <code>theme=&#123;&#123; sizes: &#123; pill: … &#125; &#125;&#125;</code>, or a
                single instance via <code>paddingInline</code> / <code>paddingBlock</code> /{" "}
                <code>borderRadius</code> (8pt scale token, e.g. <code>"0.5x"</code>;{" "}
                <code>borderRadius</code> also accepts a named <code>sizes.borderRadius</code>{" "}
                stop like <code>"sm"</code>).
              </li>
              <li>
                <strong>Typography:</strong> defaults to <code>bodyXs</code>{" "}
                (12px, weight 500). Pass <code>variant</code> for other{" "}
                <code>Text</code> sizes.
              </li>
              <li>
                <strong>Icons:</strong> <code>leadingVisual</code> /{" "}
                <code>trailingVisual</code> — wrap glyphs in{" "}
                <code>&lt;Icon size="xs" | "sm" | …&gt;</code>. Pill height is
                fixed via <code>sizes.pill.height</code> (20px); icon size does
                not expand the chip.
              </li>
            </ul>
          </div>

          <div className="cube-docs-section">
            <h3 className="cube-docs-section__title">As link</h3>
            <Pill
              href="https://example.com"
              shade="gray"
              intensity="light"
              variant="bodyXs"
              trailingVisual={<Icon name="open_in_new" size="xs" />}
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

export const WithBodySm: Story = {
  render: () => (
    <Pill variant="bodySm" shade="gray" intensity="light" border>
      Larger label
    </Pill>
  ),
};

export const LayoutOverrides: Story = {
  name: "Per-instance padding / borderRadius",
  render: () => (
    <Stack direction="horizontal" gap="sm" align="center" wrap>
      <Pill shade="gray" intensity="light">
        default
      </Pill>
      <Pill shade="gray" intensity="light" paddingInline="2x">
        paddingInline="2x"
      </Pill>
      <Pill shade="gray" intensity="light" paddingBlock="0.5x">
        paddingBlock="0.5x"
      </Pill>
      <Pill shade="gray" intensity="light" borderRadius="0.5x">
        borderRadius="0.5x"
      </Pill>
      <Pill shade="gray" intensity="light" borderRadius="full">
        borderRadius="full"
      </Pill>
    </Stack>
  ),
};

export const BorderOverrides: Story = {
  name: "Per-instance borderColor / borderWidth",
  render: () => (
    <Stack direction="horizontal" gap="sm" align="center" wrap>
      <Pill shade="gray" intensity="light">
        default (no visible border)
      </Pill>
      <Pill shade="gray" intensity="light" borderColor="error.default">
        borderColor="error.default"
      </Pill>
      <Pill shade="gray" intensity="light" borderColor="#ff6b6b">
        borderColor="#ff6b6b" (raw)
      </Pill>
      <Pill shade="gray" intensity="light" borderColor="error.default" borderWidth="thick">
        borderWidth="thick"
      </Pill>
      <Pill shade="gray" intensity="light" borderColor="error.default" borderWidth="3px">
        borderWidth="3px" (raw)
      </Pill>
      <Pill shade="blue" intensity="bold" border borderColor="error.default" borderWidth="thick">
        overriding an already-bordered pill
      </Pill>
    </Stack>
  ),
};
