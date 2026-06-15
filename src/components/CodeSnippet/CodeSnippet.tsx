import { JsonCodeView, type JsonCodeViewProps } from "../CodeBlock/JsonCodeView";

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
