import { CodeBlock } from "@sragatiping/cuboid";
import type { CodeBlockLanguage } from "@sragatiping/cuboid";
import { defineReadBlock } from "../../core";

/** The languages Cuboid's `CodeBlock` can colour. */
export const CODE_LANGUAGES: { value: CodeBlockLanguage; label: string }[] = [
  { value: "text", label: "Plain text" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "jsx", label: "JSX" },
  { value: "tsx", label: "TSX" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
];

/** A language the document names, or plain text when it names one Cuboid cannot colour. */
export const languageOf = (value: unknown): CodeBlockLanguage => CODE_LANGUAGES.find((l) => l.value === value)?.value ?? "text";

export type CodeAttrs = { language: CodeBlockLanguage };

/** A reader sees Cuboid's `CodeBlock`: coloured, with line numbers. */
export const codeBlockRead = defineReadBlock<CodeAttrs>({
  name: "codeBlock",
  attrs: { language: { default: "text" } },
  Read: ({ attrs, text }) => <CodeBlock code={text} language={languageOf(attrs.language)} aria-label="Code" />,
});
