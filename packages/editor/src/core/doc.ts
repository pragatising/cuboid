/** The document is plain JSON that we own. The editing engine is an implementation detail behind it. */
export type Mark = { type: string; attrs?: Record<string, unknown> };

export type DocNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: DocNode[];
  text?: string;
  marks?: Mark[];
};
