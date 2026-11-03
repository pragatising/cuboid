import { Highlight, Text } from "@sragatiping/cuboid";

export function Default() {
  return <Highlight color="yellow">highlighted text</Highlight>;
}

export function InASentence() {
  return (
    <Text>
      Previously at <Highlight color="neutral">Acme Inc</Highlight>, building <Highlight color="blue">search infrastructure</Highlight>.
    </Text>
  );
}
