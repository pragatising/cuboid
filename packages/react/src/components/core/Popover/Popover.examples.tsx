import { useState } from "react";
import { Box, Button, Popover, Text } from "@sragatiping/cuboid";
import type { Frame } from "@sragatiping/bench/example";

export function Default() {
  return (
    <Popover trigger={<Button variant="secondary">Open popover</Button>}>
      <Popover.Body>
        <Text size="sm">Any content can go here.</Text>
        <Button variant="primary">Action</Button>
      </Popover.Body>
    </Popover>
  );
}
Default.frame = { height: 220 } satisfies Frame;

export function Controlled() {
  const [open, setOpen] = useState(false);
  return (
    <Box flexDirection="row" gap="2x">
      <Popover open={open} onOpenChange={setOpen} trigger={<Button variant="secondary">{open ? "Close" : "Open"} popover</Button>}>
        <Popover.Body>
          <Text size="sm">Controlled with open and onOpenChange.</Text>
        </Popover.Body>
      </Popover>
      <Button variant="ghost" onClick={() => setOpen((now) => !now)}>Toggle from outside</Button>
    </Box>
  );
}
Controlled.frame = { height: 220 } satisfies Frame;

export function WithHeaderAndFooter() {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen} trigger={<Button variant="secondary">Rename</Button>}>
      <Popover.Header onClose={() => setOpen(false)}>Rename file</Popover.Header>
      <Popover.Body>
        <Text size="sm">The new name is shown to everyone with access.</Text>
      </Popover.Body>
      <Popover.Footer primary={{ label: "Save", onClick: () => setOpen(false) }} secondary={{ label: "Cancel", onClick: () => setOpen(false) }} />
    </Popover>
  );
}
WithHeaderAndFooter.frame = { height: 300 } satisfies Frame;

export function Placements() {
  return (
    <Box flexDirection="row" gap="2x">
      {(["top", "bottom", "left", "right"] as const).map((placement) => (
        <Popover key={placement} placement={placement} trigger={<Button variant="secondary">{placement}</Button>}>
          <Popover.Body><Text size="sm">{placement}</Text></Popover.Body>
        </Popover>
      ))}
    </Box>
  );
}
Placements.frame = { height: 280 } satisfies Frame;
