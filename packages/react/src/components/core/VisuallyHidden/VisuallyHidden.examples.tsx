import { Button, Icon, VisuallyHidden } from "@sragatiping/cuboid";

/** The words are in the page for a screen reader and not on the screen. */
export function NamesAnIconOnlyControl() {
  return (
    <Button variant="secondary">
      <Icon name="delete" />
      <VisuallyHidden>Delete file</VisuallyHidden>
    </Button>
  );
}
