import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Title, Primary, Controls, Subtitle } from "@storybook/blocks";
import { Stack } from "../Stack";
import { Text } from "../Text";
import { Link } from "./Link";

const meta: Meta<typeof Link> = {
  title: "Core/Link",
  component: Link,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      page: () => (
        <>
          <Title />
          <Subtitle>
            Smart links — token colors from <code>color.link.*</code>.
            Use <code>variant=&quot;inline&quot;</code> inside body copy;
            <code> standalone</code> for nav and contact rows.
          </Subtitle>

          <div className="cube-docs-section">
            <h3 className="cube-docs-section__title">Inline (in prose)</h3>
            <Text role="body" size="sm">
              Read the{" "}
              <Link href="#getting-started" variant="inline">
                getting started guide
              </Link>{" "}
              for setup steps, or browse the component API reference.
            </Text>
          </div>

          <div className="cube-docs-section">
            <h3 className="cube-docs-section__title">Standalone</h3>
            <Stack gap="xxs">
              <Link href="mailto:hello@example.com" variant="standalone">
                support@example.com
              </Link>
              <Link href="https://example.com" variant="standalone" external>
                Documentation
              </Link>
            </Stack>
          </div>

          <Primary />
          <Controls />
        </>
      ),
    },
  },
};
export default meta;
type Story = StoryObj<typeof Link>;

export const Playground: Story = {
  args: {
    href: "https://example.com",
    variant: "standalone",
    external: false,
    children: "Link label",
  },
  argTypes: {
    variant: { control: "radio", options: ["inline", "standalone"] },
    external: { control: "boolean" },
  },
};
