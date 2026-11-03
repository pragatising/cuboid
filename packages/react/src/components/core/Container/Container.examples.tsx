import { Container, Heading, Text } from "@sragatiping/cuboid";

export function Page() {
  return (
    <Container width="page" paddingBlock="lg" gap="1x">
      <Heading as="h2" size="h3">Page shell</Heading>
      <Text color="neutral.muted">Capped at the page width and centred, with the container's padding.</Text>
    </Container>
  );
}

export function Content() {
  return (
    <Container width="content" gap="1x">
      <Heading as="h2" size="h3">Article column</Heading>
      <Text color="neutral.muted">The narrower content width, for a column of reading text.</Text>
    </Container>
  );
}

export function Full() {
  return (
    <Container width="full" paddingBlock="lg">
      <Text>No width cap: it fills what it is in.</Text>
    </Container>
  );
}
