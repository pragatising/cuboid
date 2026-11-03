import { Avatar, Box, Text } from "@sragatiping/cuboid";

export function Default() {
  return <Avatar name="Ada Lovelace" />;
}

/** The first letter is drawn, and the shade follows from the name: the same person is the same colour everywhere. */
export function FromNames() {
  return (
    <Box flexDirection="row" gap="1x">
      {["Ada Lovelace", "Grace Hopper", "Linus Torvalds", "Margaret Hamilton", "Alan Turing", "Katherine Johnson"].map((name) => (
        <Avatar key={name} name={name} />
      ))}
    </Box>
  );
}

/** With no name there is nothing to name: a person icon, in gray. */
export function Anonymous() {
  return <Avatar />;
}

export function Sizes() {
  return (
    <Box flexDirection="row" alignItems="center" gap="2x">
      {(["sm", "md", "lg"] as const).map((size) => (
        <Avatar key={size} name="Ada" size={size} />
      ))}
      {(["sm", "md", "lg"] as const).map((size) => (
        <Avatar key={size} size={size} />
      ))}
    </Box>
  );
}

export function Shades() {
  return (
    <Box flexDirection="row" flexWrap="wrap" gap="1x">
      {(["purple", "indigo", "blue", "mag", "red", "brick", "emerald", "teal", "yellow", "lime", "gray"] as const).map((shade) => (
        <Avatar key={shade} name="A" shade={shade} />
      ))}
    </Box>
  );
}

export function WithPhoto() {
  return <Avatar name="Ada Lovelace" size="lg" src={`data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#bfd6ff"/><circle cx="32" cy="26" r="12" fill="#fff"/><path d="M8 64c2-16 14-22 24-22s22 6 24 22z" fill="#7aa2f7"/></svg>')}`} />;
}

/** The avatar names the person; the text beside it need not say it twice. */
export function BesideAName() {
  return (
    <Box flexDirection="row" alignItems="center" gap="1x">
      <Avatar name="Ada Lovelace" aria-hidden />
      <Text>Ada Lovelace</Text>
    </Box>
  );
}

export function Stack() {
  return (
    <Avatar.Stack aria-label="Collaborators">
      <Avatar name="Ada" />
      <Avatar name="Grace" />
      <Avatar name="Linus" />
    </Avatar.Stack>
  );
}

/** More than `max` are counted. */
export function Overflow() {
  return (
    <Avatar.Stack aria-label="Collaborators">
      {["Ada", "Grace", "Linus", "Margaret", "Alan", "Katherine"].map((name) => (
        <Avatar key={name} name={name} />
      ))}
    </Avatar.Stack>
  );
}

export function WithAddButton() {
  return (
    <Avatar.Stack aria-label="Collaborators" onAdd={() => {}}>
      <Avatar name="Ada" />
      <Avatar name="Grace" />
    </Avatar.Stack>
  );
}

export function NobodyYet() {
  return <Avatar.Stack aria-label="Collaborators" onAdd={() => {}} />;
}

export function StackSizes() {
  return (
    <Box gap="2x">
      {(["sm", "md", "lg"] as const).map((size) => (
        <Avatar.Stack key={size} size={size} aria-label={`Collaborators (${size})`} onAdd={() => {}}>
          <Avatar name="Ada" />
          <Avatar name="Grace" />
          <Avatar name="Linus" />
          <Avatar name="Margaret" />
        </Avatar.Stack>
      ))}
    </Box>
  );
}
