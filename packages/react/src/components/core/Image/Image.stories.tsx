import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Box } from "../Box";
import { Text } from "../Text";
import { Image } from "./Image";
import type { ImageChange, ImageProps } from "./Image";

const meta: Meta<typeof Image> = {
  title: "Core/Image",
  component: Image,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  argTypes: { onChange: { action: "changed" }, onExpand: { action: "expanded" }, width: { control: { type: "range", min: 20, max: 100, step: 1 } }, editable: { control: "boolean" }, bordered: { control: "boolean" } },
};
export default meta;
type Story = StoryObj<typeof Image>;

/** An inline picture so the stories need no network. */
const PICTURE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#bfd6ff"/><stop offset="1" stop-color="#e8d7ff"/></linearGradient></defs><rect width="1200" height="600" fill="url(#g)"/><circle cx="880" cy="190" r="70" fill="#fff" opacity=".7"/><path d="M0 600 L330 300 L560 480 L760 360 L1200 600 Z" fill="#7aa2f7" opacity=".75"/></svg>`);

/** Read: the picture at its width, with its caption. Hover for the toolbar to save it (and expand it, when `onExpand` is given). */
export const Read: Story = {
  args: { src: PICTURE, alt: "A mountain range at dusk", caption: "A caption sits under the picture.", width: 70 },
};

/** The same component, editable, with nothing yet: a bar to click or drop a file on. */
export const Empty: Story = {
  args: { editable: true },
  render: function Render(args) {
    const [value, setValue] = useState<ImageProps>({});
    return <Image {...args} {...value} onChange={(change: ImageChange) => setValue((now) => ({ ...now, ...change }))} />;
  },
};

/** Editable with a picture: hover it for the handles on each side (drag, or Tab to one and use the arrow keys), the caption field and the toolbar. */
export const Editable: Story = {
  render: function Render(args) {
    const [value, setValue] = useState<ImageProps>({ src: PICTURE, alt: "A mountain range at dusk", width: 80 });
    return (
      <Box gap="2x">
        <Image {...args} {...value} editable onChange={(change: ImageChange) => setValue((now) => ({ ...now, ...change }))} />
        <Text size="sm" color="neutral.muted">
          Width {value.width}%{value.caption ? ` · caption “${value.caption}”` : ""}
        </Text>
      </Box>
    );
  },
};

/** Upload is the caller's: `onUpload` takes the file and returns the address to keep. A rejection shows its message and offers a retry. */
export const Uploading: Story = {
  render: function Render(args) {
    const [value, setValue] = useState<ImageProps>({});
    return (
      <Image
        {...args}
        {...value}
        editable
        onUpload={(file) => new Promise((resolve, reject) => setTimeout(() => (file.size > 1_000_000 ? reject(new Error("The file is over 1 MB")) : resolve(URL.createObjectURL(file))), 1200))}
        onChange={(change: ImageChange) => setValue((now) => ({ ...now, ...change }))}
      />
    );
  },
};
