import { ActionMenu, Box, Button } from "@sragatiping/cuboid";
import { CodeText } from "./CodeText";
import { NodeViewContent } from "@tiptap/react";
import { defineBlock } from "../../core";
import { CODE_LANGUAGES, codeBlockRead, languageOf } from "./codeBlock.read";

/** The writer edits plain text in place, in the same typeface, with a menu for the language; the colours return when the block is read. */
export const codeBlock = defineBlock(codeBlockRead, {
  holds: "text",
  menu: { label: "Code block", group: "basic", keywords: ["code", "snippet", "pre"] },
  Write: ({ attrs, update }) => {
    const current = CODE_LANGUAGES.find((l) => l.value === languageOf(attrs.language))!;
    return (
      <Box border={{ color: "muted" }} borderRadius="md" backgroundColor="canvas.inset" overflow="hidden" data-component="CodeBlock.Write">
        <Box padding="0.5x" paddingBlockEnd={0} contentEditable={false} flexDirection="row" justifyContent="flex-end">
          <ActionMenu
            aria-label="Language"
            placement="bottom-end"
            trigger={
              <Button variant="ghost" size="sm" aria-label={`Language: ${current.label}`}>
                {current.label}
              </Button>
            }
          >
            {CODE_LANGUAGES.map((language) => (
              <ActionMenu.Item key={language.value} selected={language.value === current.value} onClick={() => update({ language: language.value })}>
                {language.label}
              </ActionMenu.Item>
            ))}
          </ActionMenu>
        </Box>
        <NodeViewContent as={CodeText} />
      </Box>
    );
  },
});
