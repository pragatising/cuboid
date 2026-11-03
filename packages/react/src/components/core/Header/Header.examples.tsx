import { Breadcrumbs, Button, Header, Icon, IconButton } from "@sragatiping/cuboid";

export function Default() {
  return (
    <Header>
      <Header.Leading>
        <IconButton aria-label="Open menu" variant="ghost" size="md" icon={<Icon name="menu" />} />
        <Breadcrumbs items={[{ label: "Dashboard", href: "#dashboard" }, { label: "Customers" }]} />
      </Header.Leading>
      <Header.Trailing>
        <IconButton aria-label="Search" variant="ghost" size="md" icon={<Icon name="search" />} />
        <Button variant="secondary" size="md">New</Button>
      </Header.Trailing>
    </Header>
  );
}

export function WithBackAndDivider() {
  return (
    <Header>
      <Header.Leading>
        <IconButton aria-label="Go back" variant="ghost" size="md" icon={<Icon name="arrow_back" />} />
        <Header.Divider />
        <Breadcrumbs items={[{ label: "Record details" }]} />
      </Header.Leading>
      <Header.Trailing>
        <IconButton aria-label="More actions" variant="ghost" size="md" icon={<Icon name="more_horiz" />} />
      </Header.Trailing>
    </Header>
  );
}
