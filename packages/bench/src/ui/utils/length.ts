/** The root font size rem resolves against: the browser default. */
const REM_BASE_PX = 16;

/** Split `a, min(b, c), d` at the commas that are not inside parentheses. */
function splitArguments(list: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < list.length; i++) {
    if (list[i] === "(") depth++;
    else if (list[i] === ")") depth--;
    else if (list[i] === "," && depth === 0) {
      out.push(list.slice(start, i));
      start = i + 1;
    }
  }
  out.push(list.slice(start));
  return out.map((part) => part.trim());
}

function evaluate(expression: string): number | null {
  const fn = /^(min|max|clamp)\((.*)\)$/s.exec(expression);
  if (fn) {
    const args = splitArguments(fn[2]).map(evaluate);
    if (args.some((arg) => arg === null)) return null;
    const [first, second, third] = args as number[];
    if (fn[1] === "min") return Math.min(...(args as number[]));
    if (fn[1] === "max") return Math.max(...(args as number[]));
    return args.length === 3 ? Math.max(first, Math.min(second, third)) : null;
  }

  const length = /^(-?(?:\d+\.?\d*|\.\d+))(px|rem|em|vw|vh)?$/.exec(expression);
  if (!length) return null;
  const n = parseFloat(length[1]);
  switch (length[2]) {
    case "rem":
    case "em":
      return n * REM_BASE_PX;
    case "vw":
      return typeof window === "undefined" ? null : (n / 100) * window.innerWidth;
    case "vh":
      return typeof window === "undefined" ? null : (n / 100) * window.innerHeight;
    default:
      return n; // px, or a bare number
  }
}

/**
 * A token or CSS length in pixels: `"0.125rem"`, `"2px"`, `"4"`, viewport units (`"90vw"`), and `min()` / `max()` / `clamp()` of
 * those (`"min(90vw, 56rem)"`). `fallback` for anything else (a percentage has no pixel value without a parent).
 */
export function lengthToPx(value: string, fallback = 0): number {
  return evaluate(value.trim()) ?? fallback;
}
