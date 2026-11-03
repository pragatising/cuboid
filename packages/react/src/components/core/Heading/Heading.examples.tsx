import { Box, Heading } from "@sragatiping/cuboid";

export function Default() {
  return <Heading>Heading</Heading>;
}

export function Sizes() {
  return (
    <Box gap="1x">
      {(["h1", "h2", "h3", "h4", "h5", "h6"] as const).map((size) => (
        <Heading key={size} as={size} size={size}>{size}</Heading>
      ))}
    </Box>
  );
}

/** The level a heading has in the page is `as`; how large it looks is `size`. */
export function LevelIsNotSize() {
  return (
    <Box gap="1x">
      <Heading as="h1" size="h3">An h1 that looks small</Heading>
      <Heading as="h4" size="h1">An h4 that looks large</Heading>
    </Box>
  );
}

export function Colours() {
  return (
    <Box gap="1x">
      <Heading size="h3" color="neutral.muted">Muted</Heading>
      <Heading size="h3" color="success.strong">Success</Heading>
      <Heading size="h3" color="danger.strong">Danger</Heading>
    </Box>
  );
}
