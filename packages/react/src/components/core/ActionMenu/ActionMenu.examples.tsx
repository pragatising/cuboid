import { ActionMenu, Button } from "@sragatiping/cuboid";

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
