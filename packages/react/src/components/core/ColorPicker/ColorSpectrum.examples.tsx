import { useState } from "react";
import { Box, ColorSpectrum, Text } from "@sragatiping/cuboid";

export function Default() {
  const [value, setValue] = useState("#1c60d4");
  return (
    <Box gap="2x" style={{ width: "16rem" }}>
      <ColorSpectrum aria-label="Colour" value={value} onValueChange={setValue} />
      <Text size="sm" color="neutral.muted">{value}</Text>
    </Box>
  );
}
