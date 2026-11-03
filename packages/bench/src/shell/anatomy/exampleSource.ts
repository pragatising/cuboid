/**
 * What the Anatomy pane shows of an example: the code the engine printed for it, and which line of it each displayed line is.
 * `lineMap[i]` says which line of the printed code displayed line `i` came from, or null for a line made for display (an import, a blank).
 */
export type ExampleCode = {
  name: string;
  code: string;
  lineMap: (number | null)[];
};
