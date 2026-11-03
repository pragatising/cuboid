import { useState } from "react";
import { Box, Image, Text } from "@sragatiping/cuboid";
import type { ImageChange, ImageProps } from "@sragatiping/cuboid";

/** An inline picture, so the examples need no network. */
const PICTURE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#bfd6ff"/><stop offset="1" stop-color="#e8d7ff"/></linearGradient></defs><rect width="1200" height="600" fill="url(#g)"/><circle cx="880" cy="190" r="70" fill="#fff" opacity=".7"/><path d="M0 600 L330 300 L560 480 L760 360 L1200 600 Z" fill="#7aa2f7" opacity=".75"/></svg>`,
  );

export function Read() {
  return <Image src={PICTURE} alt="A mountain range at dusk" caption="A caption sits under the picture." width={70} />;
}

export function Bordered() {
  return <Image src={PICTURE} alt="A mountain range at dusk" bordered width={50} />;
}

/** Editable with nothing yet: a bar to click, or to drop a file on. */
export function Empty() {
  const [value, setValue] = useState<ImageProps>({});
  return <Image {...value} editable onChange={(change: ImageChange) => setValue((now) => ({ ...now, ...change }))} />;
}

/** Hover the picture for the handles on each side, the caption field and the toolbar. */
export function Editable() {
  const [value, setValue] = useState<ImageProps>({ src: PICTURE, alt: "A mountain range at dusk", width: 80 });
  return (
    <Box gap="2x">
      <Image {...value} editable onChange={(change: ImageChange) => setValue((now) => ({ ...now, ...change }))} />
      <Text size="sm" color="neutral.muted">Width {value.width}%</Text>
    </Box>
  );
}
