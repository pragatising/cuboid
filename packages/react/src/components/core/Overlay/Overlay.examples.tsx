import { useState } from "react";
import { Button, Overlay } from "@sragatiping/cuboid";

/** The scrim under a modal layer. Click it, or press Escape, to dismiss. */
export function Modal() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>Show the scrim</Button>
      <Overlay open={open} onDismiss={() => setOpen(false)} aria-label="Dismiss" />
    </>
  );
}

/** The lighter scrim that goes under a sheet. */
export function Sheet() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>Show the lighter scrim</Button>
      <Overlay open={open} variant="sheet" onDismiss={() => setOpen(false)} aria-label="Dismiss" />
    </>
  );
}
