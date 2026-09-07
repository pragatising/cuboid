import { JsonViewer as JsonCodeView, type JsonViewerProps as JsonCodeViewProps } from "../CodeBlock/JsonViewer/JsonViewer";

/**
 * @deprecated Use {@link JsonCodeView} from `@sragatiping/cuboid` / `components/CodeBlock`.
 */
export type CodeSnippetProps = JsonCodeViewProps;

/**
 * @deprecated Use {@link JsonCodeView} — JSON data + collapse → {@link CodeSurface}.
 */
export function CodeSnippet(props: CodeSnippetProps) {
  return <JsonCodeView {...props} />;
}
