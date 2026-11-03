import { Button, EmptyState } from "@sragatiping/cuboid";

export function Default() {
  return <EmptyState icon="inbox" heading="No messages" description="New messages will show up here." />;
}

export function Compact() {
  return <EmptyState layout="compact" icon="search" description="No results" />;
}

export function WithColouredIcon() {
  return (
    <EmptyState
      icon="task_alt"
      iconProps={{ backgroundColor: "success.subtle", color: "success.strong" }}
      heading="All done"
      description="Nothing is left to review."
    />
  );
}

export function WithAnAction() {
  return (
    <EmptyState
      icon="folder_open"
      heading="No projects yet"
      description={<Button variant="primary">Create a project</Button>}
    />
  );
}
