/** `((value: string) => void)` is `(value: string) => void`: the outer pair is the type's own wrapping. */
export const unwrap = (type: string) =>
  /^\((.*)\)$/.test(type) && !/^\([^()]*\)$/.test(type) && /=>/.test(type) ? type.slice(1, -1) : type;

/** Splits at the commas that are not inside brackets: `a: Map<K, V>, b: string` is two. */
function topLevel(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let from = 0;
  for (let i = 0; i < text.length; i++) {
    if ("(<[{".includes(text[i])) depth++;
    else if (")>]}".includes(text[i]) && !(text[i] === ">" && text[i - 1] === "=")) depth--;
    else if (text[i] === "," && depth === 0) {
      parts.push(text.slice(from, i).trim());
      from = i + 1;
    }
  }
  const last = text.slice(from).trim();
  return last ? [...parts, last] : parts;
}

export type FunctionType = { params: { name?: string; type: string }[]; returns: string };

/** `(item: HTMLElement) => void` as its parts, or null when it is not a function type this can read. */
export function functionOf(type: string): FunctionType | null {
  const text = unwrap(type);
  if (!text.startsWith("(")) return null;
  let depth = 0;
  let close = -1;
  for (let i = 0; i < text.length && close === -1; i++) {
    if (text[i] === "(") depth++;
    else if (text[i] === ")" && --depth === 0) close = i;
  }
  const rest = close === -1 ? null : /^\s*=>\s*(.+)$/s.exec(text.slice(close + 1));
  if (!rest) return null;
  const params = topLevel(text.slice(1, close)).map((param) => {
    const split = /^([\w$.]+\??)\s*:\s*(.+)$/s.exec(param);
    return split ? { name: split[1], type: split[2] } : { type: param };
  });
  return { params, returns: rest[1].trim() };
}
