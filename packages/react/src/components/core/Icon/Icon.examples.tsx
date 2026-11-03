import { Box, Icon } from "@sragatiping/cuboid";

export function Default() {
  return <Icon name="account_circle" />;
}

export function Sizes() {
  return (
    <Box flexDirection="row" alignItems="center" gap="2x">
      {(["xs", "sm", "md", "lg"] as const).map((size) => (
        <Icon key={size} name="account_circle" size={size} />
      ))}
    </Box>
  );
}

export function Colours() {
  return (
    <Box flexDirection="row" gap="2x">
      <Icon name="check_circle" color="success.strong" />
      <Icon name="warning" color="warning.strong" />
      <Icon name="error" color="danger.strong" />
    </Box>
  );
}

export function Filled() {
  return (
    <Box flexDirection="row" gap="2x">
      <Icon name="favorite" />
      <Icon name="favorite" fill />
    </Box>
  );
}

/** An icon that carries meaning on its own has a label; a decorative one has none. */
export function Labelled() {
  return <Icon name="warning" label="Warning" color="warning.strong" />;
}
