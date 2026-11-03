import { useState } from "react";
import { Box, Button, Heading, Icon, IconButton, Sheet, Text } from "@sragatiping/cuboid";

export function Right() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open sheet</Button>
      <Sheet open={open} onOpenChange={setOpen} aria-label="Details">
        <Sheet.Body>
          <Box gap="2x">
            <Heading as="h2" size="h3">Details</Heading>
            <Text color="neutral.muted">Content goes in the body.</Text>
            <Button onClick={() => setOpen(false)}>Close</Button>
          </Box>
        </Sheet.Body>
      </Sheet>
    </>
  );
}

export function WithHeader() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open filters</Button>
      <Sheet open={open} onOpenChange={setOpen} aria-labelledby="filters-title">
        <Sheet.Header>
          <span id="filters-title"><Heading as="h2" size="h3">Filters</Heading></span>
          <IconButton aria-label="Close" variant="ghost" size="md" onClick={() => setOpen(false)} icon={<Icon name="close" />} />
        </Sheet.Header>
        <Sheet.Body>
          <Box gap="1x">
            {Array.from({ length: 24 }, (_, index) => (
              <Text key={index}>Filter option {index + 1}</Text>
            ))}
          </Box>
        </Sheet.Body>
      </Sheet>
    </>
  );
}

export function Left() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open from the left</Button>
      <Sheet open={open} edge="left" onOpenChange={setOpen} aria-label="Menu">
        <Sheet.Body><Text>Menu</Text></Sheet.Body>
      </Sheet>
    </>
  );
}

export function Bottom() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open from the bottom</Button>
      <Sheet open={open} edge="bottom" onOpenChange={setOpen} aria-label="Actions">
        <Sheet.Body><Text>Actions</Text></Sheet.Body>
      </Sheet>
    </>
  );
}

export function Resizable() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open resizable</Button>
      <Sheet open={open} resizable onOpenChange={setOpen} aria-label="Resizable">
        <Sheet.Body><Text>Drag the edge to change the width.</Text></Sheet.Body>
      </Sheet>
    </>
  );
}

export function NotModal() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen((now) => !now)}>{open ? "Close" : "Open"} beside the page</Button>
      <Sheet open={open} modal={false} onOpenChange={setOpen} aria-label="Notes">
        <Sheet.Body><Text>The page stays usable behind it.</Text></Sheet.Body>
      </Sheet>
    </>
  );
}
