import { Box, Icon, IconButton } from "@sragatiping/cuboid";

export function Default() {
  return <IconButton aria-label="Favourite" description="Add to favourites" icon={<Icon name="star" />} />;
}

export function Variants() {
  return (
    <Box flexDirection="row" gap="1x">
      <IconButton aria-label="Outlined" variant="outlined" icon={<Icon name="star" />} />
      <IconButton aria-label="Ghost" variant="ghost" icon={<Icon name="star" />} />
    </Box>
  );
}

export function Sizes() {
  return (
    <Box flexDirection="row" alignItems="center" gap="1x">
      {(["sm", "md", "lg"] as const).map((size) => (
        <IconButton key={size} size={size} aria-label={`Favourite (${size})`} icon={<Icon name="star" />} />
      ))}
    </Box>
  );
}

export function Selected() {
  return <IconButton aria-label="Favourite, on" selected icon={<Icon name="star" />} />;
}

export function Disabled() {
  return <IconButton aria-label="Favourite, unavailable" disabled description="Unavailable" icon={<Icon name="star" />} />;
}

export function Loading() {
  return <IconButton aria-label="Saving" loading icon={<Icon name="star" />} />;
}

export function WithKeybinding() {
  return <IconButton aria-label="Search" keybindingHint="Mod+K" variant="ghost" icon={<Icon name="search" />} />;
}
