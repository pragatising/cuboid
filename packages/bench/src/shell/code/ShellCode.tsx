import React, { useMemo, useState } from "react";
import { Box, Text } from "../../ui/index";
import type { ExampleCode as Example } from "../anatomy/exampleSource";
import type { Highlight } from "../anatomy/AnatomyContext";
import { CodeEditor } from "./CodeEditor";
import type { JsxElement } from "./jsx";
import { suggestRequiredProp } from "./suggest";
import { env } from "./env";

/**
 * The example behind the Anatomy view, read only: the piece of it the part under the pointer was written as is marked, and brought into
 * view. The example keeps its own lines inside a file, so a line of the file is mapped to the line the document shows it on.
 */
export function AnatomyCode({ example, hover }: { example: Example; hover: Highlight | null }) {
  const marked = useMemo(
    () => (hover ? { ranges: hover, lineOf: (fileLine: number) => (example.lineMap.indexOf(fileLine) < 0 ? null : example.lineMap.indexOf(fileLine) + 1) } : null),
    [hover, example],
  );
  return <CodeEditor readOnly value={example.code} marked={marked} aria-label={`Example code: ${example.name}`} />;
}

/**
 * The example as code to write: edited in place, with suggestions from the components' own models (a tag after `<`, the props of the element
 * you are in, an enum prop's values), a suggestion for the next required prop that Tab accepts, and a line saying what element the cursor is
 * in. Editing does not yet change the page: drawing edited code needs it compiled and run, which is the next step.
 */
export function PlaygroundCode({ example }: { example: Example }) {
  const [value, setValue] = useState(example.code);
  const [element, setElement] = useState<JsxElement | null>(null);
  const suggest = useMemo(() => suggestRequiredProp(env), []);
  // A different example is a different text: start again from it.
  const [shown, setShown] = useState(example.code);
  if (shown !== example.code) {
    setShown(example.code);
    setValue(example.code);
  }
  return (
    <Box gap="1x">
      <CodeEditor value={value} onChange={setValue} env={env} suggest={suggest} onCursorElement={setElement} aria-label={`Example code: ${example.name}`} />
      <Text size="sm" color="neutral.muted" aria-live="polite">
        {element ? `In <${element.tag}>` : "Not in an element"} · Tab accepts a suggestion
      </Text>
    </Box>
  );
}
