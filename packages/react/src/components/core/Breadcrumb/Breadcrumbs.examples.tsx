import { Box, Breadcrumbs } from "@sragatiping/cuboid";

export function Default() {
  return (
    <Breadcrumbs
      items={[
        { label: "Dashboard", href: "#dashboard" },
        { label: "Customers", href: "#customers" },
        { label: "Details" },
      ]}
    />
  );
}

export function Levels() {
  return (
    <Box gap="2x">
      <Breadcrumbs items={[{ label: "Level 1" }]} />
      <Breadcrumbs items={[{ label: "Level 1", href: "#one" }, { label: "Level 2" }]} />
      <Breadcrumbs items={[{ label: "Level 1", href: "#one" }, { label: "Level 2", href: "#two" }, { label: "Level 3" }]} />
    </Box>
  );
}

/** One link of a trail on its own: a link, or the current page as text. */
export function Link() {
  return (
    <Box flexDirection="row" gap="2x">
      <Breadcrumbs.Link href="#home">Home</Breadcrumbs.Link>
      <Breadcrumbs.Link current>Current page</Breadcrumbs.Link>
    </Box>
  );
}
