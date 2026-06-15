import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Title, Primary, Controls, Subtitle } from "@storybook/blocks";
import { CodeBlock } from "./CodeBlock";
import {
  CodeViewingArchitectureSection,
  CodeViewingDocsSubtitle,
} from "./CodeViewingDocs";
import {
  buildLongJavaScript,
  sampleCss,
  sampleHtml,
  sampleJavaScript,
  sampleTypeScript,
} from "./__fixtures__/source-samples";

const meta: Meta<typeof CodeBlock> = {
  title: "Components/CodeBlock",
  component: CodeBlock,
  tags: ["autodocs"],
  argTypes: {
    language: {
      control: "select",
      options: ["javascript", "typescript", "jsx", "tsx", "html", "css", "text"],
    },
    height: { control: "text" },
    maxHeight: { control: "text" },
    code: { control: "text" },
    theme: { control: false },
    onWatchlistChange: { control: false },
    onLinkClick: { control: false },
  },
  parameters: {
    layout: "padded",
    docs: {
      page: () => (
        <>
          <Title />
          <Subtitle>
            <CodeViewingDocsSubtitle focus="codeBlock" />
          </Subtitle>
          <CodeViewingArchitectureSection focus="codeBlock" />
          <Primary />
          <Controls />
        </>
      ),
    },
  },
};
export default meta;
type Story = StoryObj<typeof CodeBlock>;

export const JavaScript: Story = {
  args: {
    language: "javascript",
    code: sampleJavaScript,
    maxHeight: "360px",
  },
};

export const TypeScript: Story = {
  args: {
    language: "typescript",
    code: sampleTypeScript,
    maxHeight: "320px",
  },
};

export const Html: Story = {
  args: {
    language: "html",
    code: sampleHtml,
    maxHeight: "400px",
  },
};

export const Css: Story = {
  args: {
    language: "css",
    code: sampleCss,
    maxHeight: "320px",
  },
};

export const PlainText: Story = {
  args: {
    language: "text",
    code: `curl -X GET https://api.example.com/v1/users \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Accept: application/json"`,
    maxHeight: "200px",
  },
};

/** ~200 lines — windowed rendering inside a fixed height. */
export const LargeVirtualised: Story = {
  args: {
    language: "javascript",
    code: buildLongJavaScript(200),
    height: "480px",
  },
};
