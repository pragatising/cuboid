import { Box, Callout, Text } from "@sragatiping/cuboid";

export function Default() {
  return (
    <Callout>
      <Text color="neutral.muted">A short note or pull quote set apart from the surrounding paragraph.</Text>
    </Callout>
  );
}

export function InText() {
  return (
    <Box gap="2x">
      <Text>Body copy can introduce a quoted or emphasised passage.</Text>
      <Callout>
        <Text color="neutral.muted">Minimising back and forth between stimulus, cognition and action.</Text>
      </Callout>
      <Text>The copy carries on after it.</Text>
    </Box>
  );
}

export function Surfaces() {
  return (
    <Box gap="2x">
      {(["canvas.inset", "informational.subtle", "success.subtle", "warning.subtle", "danger.subtle"] as const).map((surface) => (
        <Callout key={surface} backgroundColor={surface}>
          <Text>{surface}</Text>
        </Callout>
      ))}
    </Box>
  );
}
