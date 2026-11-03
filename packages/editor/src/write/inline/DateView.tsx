import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Box, InputText, Popover } from "@sragatiping/cuboid";
import { formatDate } from "../../utils/inline";
import { useAtomEditor } from "./useAtomEditor";

/** A date mention: an inline atom with the day as its only attribute, edited with the browser's date field. */
export function DateView(props: NodeViewProps) {
  const { node } = props;
  const { open, field, select, update, dismiss } = useAtomEditor(props);
  const iso = String(node.attrs.iso);
  return (
    <NodeViewWrapper as="span" style={{ display: "inline-block" }}>
      <Popover
        open={open}
        onOpenChange={(next) => (next ? select() : dismiss())}
        dismissible={false}
        autoFocus={false}
        role="dialog"
        aria-label="Date"
        returnFocusOnClose={false}
        trigger={
          <button type="button" data-date="">
            {formatDate(iso)}
          </button>
        }
      >
        <Box padding="1.5x">
          <InputText ref={field} label="Date" type="date" size="sm" value={iso} onChange={(event) => event.target.value && update({ iso: event.target.value })} />
        </Box>
      </Popover>
    </NodeViewWrapper>
  );
}
