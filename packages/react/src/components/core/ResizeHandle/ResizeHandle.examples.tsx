import { useState } from "react";
import { Box, ResizeHandle, Text } from "@sragatiping/cuboid";

/** The handle sits on one edge of a panel that is `position: relative`, and reports the size it is dragged to. */
export function RightEdge() {
  const [width, setWidth] = useState(240);
  return (
    <Box position="relative" backgroundColor="canvas.inset" padding="2x" style={{ width }}>
      <Text>{width}px wide</Text>
      <ResizeHandle edge="right" value={width} min={160} max={400} onValueChange={setWidth} aria-label="Resize panel" />
    </Box>
  );
}

export function BottomEdge() {
  const [height, setHeight] = useState(120);
  return (
    <Box position="relative" backgroundColor="canvas.inset" padding="2x" style={{ height }}>
      <Text>{height}px high</Text>
      <ResizeHandle edge="bottom" value={height} min={80} max={240} onValueChange={setHeight} aria-label="Resize panel" />
    </Box>
  );
}

export function AlwaysVisible() {
  const [width, setWidth] = useState(240);
  return (
    <Box position="relative" backgroundColor="canvas.inset" padding="2x" style={{ width }}>
      <Text>The line is drawn at rest.</Text>
      <ResizeHandle edge="right" indicator="always" value={width} min={160} max={400} onValueChange={setWidth} aria-label="Resize panel" />
    </Box>
  );
}

export function Grip() {
  const [width, setWidth] = useState(240);
  return (
    <Box position="relative" backgroundColor="canvas.inset" padding="2x" style={{ width }}>
      <Text>A short bar says it can be dragged.</Text>
      <ResizeHandle edge="right" shape="grip" value={width} min={160} max={400} onValueChange={setWidth} aria-label="Resize panel" />
    </Box>
  );
}
