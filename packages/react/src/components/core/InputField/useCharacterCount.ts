import { useState } from "react";
import type React from "react";

export type CharacterCountOptions = {
  /** Count at all. The text is `undefined` when off. @default false */
  enabled?: boolean;
  /** The controlled value, if the control is controlled. */
  value?: string | number | readonly string[];
  /** The initial value of an uncontrolled control. */
  defaultValue?: string | number | readonly string[];
  /** The limit, for `12 / 100`. Without one the text is just the number. */
  maxLength?: number;
};

/**
 * The line under a field that says how much has been typed: `12 / 100` (or `12`). It follows `value` when the control is
 * controlled and what is typed when it is not. Spread `onInput` on the control (after the consumer's own).
 */
export function useCharacterCount({ enabled = false, value, defaultValue, maxLength }: CharacterCountOptions) {
  const [typed, setTyped] = useState(() => String(defaultValue ?? "").length);
  const length = value !== undefined ? String(value).length : typed;
  const count = enabled ? (maxLength !== undefined ? `${length} / ${maxLength}` : `${length}`) : undefined;
  const onInput = (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => setTyped(event.currentTarget.value.length);
  return { count, onInput };
}
