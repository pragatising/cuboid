import type { Frame } from "@sragatiping/bench/example";
import { useState } from "react";
import { ActionMenu, Box, Button, Icon } from "@sragatiping/cuboid";

export function Default() {
  return (
    <ActionMenu
      trigger={
        <Button variant="secondary" size="md">
          Actions
        </Button>
      }
      aria-label="Actions"
    >
      <ActionMenu.Item>Edit</ActionMenu.Item>
      <ActionMenu.Item>Duplicate</ActionMenu.Item>
      <ActionMenu.Item disabled>Delete</ActionMenu.Item>
    </ActionMenu>
  );
}

export function OnAPhone() {
  return (
    <ActionMenu trigger={<Button size="md">Actions</Button>} aria-label="Actions">
      <ActionMenu.Item>Edit</ActionMenu.Item>
      <ActionMenu.Item>Duplicate</ActionMenu.Item>
    </ActionMenu>
  );
}
OnAPhone.frame = { name: "On a phone", device: "phone" } satisfies Frame;

export function Narrow() {
  return (
    <ActionMenu trigger={<Button size="md">Actions</Button>} aria-label="Actions">
      <ActionMenu.Item>Edit</ActionMenu.Item>
    </ActionMenu>
  );
}
Narrow.frame = { width: 260 } satisfies Frame;

export function WithSections() {
  return (
    <ActionMenu trigger={<Button size="md">Workspaces</Button>} aria-label="Workspaces" defaultOpen>
      <ActionMenu.Section label="Edit">
        <ActionMenu.Item>Copy</ActionMenu.Item>
        <ActionMenu.Item>Paste</ActionMenu.Item>
      </ActionMenu.Section>
      <ActionMenu.Section label="Workspace">
        <ActionMenu.Item selected>Current workspace</ActionMenu.Item>
        <ActionMenu.Item>Another workspace</ActionMenu.Item>
      </ActionMenu.Section>
    </ActionMenu>
  );
}
WithSections.frame = { height: 300 } satisfies Frame;

export function ItemVisuals() {
  return (
    <ActionMenu trigger={<Button size="md">File</Button>} aria-label="File" defaultOpen>
      <ActionMenu.Item leadingVisual={<Icon name="content_copy" />} trailingVisual={<Icon name="keyboard_command_key" />}>
        Copy
      </ActionMenu.Item>
      <ActionMenu.Item leadingVisual={<Icon name="edit" />} description="Rename this file">
        Rename
      </ActionMenu.Item>
      <ActionMenu.Item leadingVisual={<Icon name="folder" />} hasSubmenu>
        Move to
      </ActionMenu.Item>
      <ActionMenu.Item leadingVisual={<Icon name="delete" />} disabled>
        Delete
      </ActionMenu.Item>
    </ActionMenu>
  );
}
ItemVisuals.frame = { height: 300 } satisfies Frame;

export function SingleChoice() {
  const [sort, setSort] = useState("Name");
  return (
    <ActionMenu trigger={<Button size="md">Sort by {sort}</Button>} aria-label="Sort by" selectionMode="single" defaultOpen>
      <ActionMenu.Item selected={sort === "Name"} onClick={() => setSort("Name")}>
        Name
      </ActionMenu.Item>
      <ActionMenu.Item selected={sort === "Date"} onClick={() => setSort("Date")}>
        Date
      </ActionMenu.Item>
      <ActionMenu.Item selected={sort === "Size"} onClick={() => setSort("Size")}>
        Size
      </ActionMenu.Item>
    </ActionMenu>
  );
}
SingleChoice.frame = { height: 240 } satisfies Frame;

export function WithHeader() {
  const [open, setOpen] = useState(true);
  return (
    <ActionMenu trigger={<Button size="md">Filter</Button>} aria-label="Filter" open={open} onOpenChange={setOpen}>
      <ActionMenu.Header onClose={() => setOpen(false)}>Filter</ActionMenu.Header>
      <ActionMenu.Item>Active only</ActionMenu.Item>
      <ActionMenu.Item>Archived</ActionMenu.Item>
    </ActionMenu>
  );
}
WithHeader.frame = { height: 240 } satisfies Frame;

export function WithHeaderAndFooter() {
  const [open, setOpen] = useState(true);
  return (
    <ActionMenu trigger={<Button size="md">Filter</Button>} aria-label="Filter" open={open} onOpenChange={setOpen} closeOnSelect={false}>
      <ActionMenu.Header onClose={() => setOpen(false)}>Filter</ActionMenu.Header>
      <ActionMenu.Item selected keepOpenOnSelect>
        Active only
      </ActionMenu.Item>
      <ActionMenu.Item keepOpenOnSelect>Archived</ActionMenu.Item>
      <ActionMenu.Footer>
        <Box flexDirection="row" gap="xs" justifyContent="space-between">
          <Button variant="secondary" size="sm">
            Reset
          </Button>
          <Button variant="primary" size="sm">
            Done
          </Button>
        </Box>
      </ActionMenu.Footer>
    </ActionMenu>
  );
}
WithHeaderAndFooter.frame = { height: 300 } satisfies Frame;

export function WithSearch() {
  const [query, setQuery] = useState("");
  const fruit = ["Apple", "Banana", "Cherry", "Grape", "Lemon"];
  const matches = fruit.filter((name) => name.toLowerCase().includes(query.toLowerCase()));
  return (
    <ActionMenu trigger={<Button size="md">Fruit</Button>} aria-label="Fruit" defaultOpen>
      <ActionMenu.Search aria-label="Filter fruit" placeholder="Filter" value={query} onChange={(event) => setQuery(event.target.value)} />
      <ActionMenu.Empty role="status" icon="search" heading="No results" description="Try a different word" />
      {matches.map((name) => (
        <ActionMenu.Item key={name}>{name}</ActionMenu.Item>
      ))}
    </ActionMenu>
  );
}
WithSearch.frame = { height: 360 } satisfies Frame;

export function SearchWithHeaderAndFooter() {
  const [query, setQuery] = useState("");
  return (
    <ActionMenu trigger={<Button size="md">Assign</Button>} aria-label="Assign" defaultOpen>
      <ActionMenu.Header>Assign to</ActionMenu.Header>
      <ActionMenu.Search aria-label="Filter people" placeholder="Filter" value={query} onChange={(event) => setQuery(event.target.value)} />
      <ActionMenu.Item>Ada Lovelace</ActionMenu.Item>
      <ActionMenu.Item>Grace Hopper</ActionMenu.Item>
      <ActionMenu.Item>Alan Turing</ActionMenu.Item>
      <ActionMenu.Footer>
        <Button variant="secondary" size="sm">
          Invite someone
        </Button>
      </ActionMenu.Footer>
    </ActionMenu>
  );
}
SearchWithHeaderAndFooter.frame = { height: 360 } satisfies Frame;
