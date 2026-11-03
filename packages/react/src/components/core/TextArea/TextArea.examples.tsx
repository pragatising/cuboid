import { Box, TextArea } from "@sragatiping/cuboid";

export function Default() {
  return <TextArea label="Notes" placeholder="Anything to add?" rows={3} />;
}

export function WithDescription() {
  return <TextArea label="Notes" description="Visible to everyone on the team." rows={3} />;
}

export function AutoGrowWithCount() {
  return <TextArea label="Notes" autoGrow maxRows={6} rows={2} showCount maxLength={280} placeholder="It grows to six lines, then scrolls" />;
}

export function Error() {
  return <TextArea label="Notes" defaultValue="value" error="Notes cannot be saved as written." rows={3} />;
}

export function ReadOnly() {
  return <TextArea label="Notes" defaultValue={"Some read-only text\nover two lines"} readOnly rows={3} />;
}

export function Disabled() {
  return <TextArea label="Notes" defaultValue="value" disabled rows={3} />;
}

export function Sizes() {
  return (
    <Box gap="2x">
      {(["lg", "md", "sm"] as const).map((size) => (
        <TextArea key={size} size={size} label={size} rows={2} />
      ))}
    </Box>
  );
}
