import React from "react";
import { useTokens } from "../../../../../../ui/index";
import tokenSets from "~bench/generated/token-sets.json";
import { chosen } from "../../../../overrides";
import { PropField } from "../PropField";
import { typed } from "../PropSelectorsString";
import { unquote } from "../PropSelectorsEnum";
import type { PropState } from "../../useProp";
import type { Member, PropInfo } from "../../types";
import { isColorEnum, isColorSet, scaleOf, swatchGroups } from "./colors";
import { PropSelectorsTokenColor } from "./PropSelectorsTokenColor";
import { PropSelectorsTokenPicker } from "./PropSelectorsTokenPicker";

const SETS = tokenSets as unknown as Record<string, (string | number)[]>;

/** The values a part of a type is: its named set (`FgColor`, kept once), or the loose ones it lists. */
export const valuesOf = (member: Member) => (member.set ? SETS[member.set] : member.values) ?? [];

/**
 * One token of a prop's type (Figma 5038:92511): a named set of values to choose from (a list, or swatches where they are colours), or,
 * where the part is only a shape (`number`, `#hex`), a field to type in. `held` is the value when this part holds it. A prop that is
 * only a long choice (`enumMode`) is one token of its own values, and chooses as an enum does (its default is not written down).
 */
export function PropSelectorsToken({
  prop,
  state,
  member,
  held,
  enumMode,
}: {
  prop: PropInfo;
  state: PropState;
  member: Member;
  held: string | number | undefined;
  enumMode?: boolean;
}) {
  const tokens = useTokens();
  const scale = scaleOf(prop.name);
  const values = valuesOf(member);
  const label = enumMode ? prop.name : `${prop.name}: ${member.name}`;
  const text = held === undefined ? undefined : String(held);
  const numeric = !!member.free?.includes("number");
  // Nothing chosen: the datatype's name, as a type is written. A value: what it is, as code writes it.
  const tone = held === undefined ? "type" : typeof held === "number" ? "number" : "string";
  const choose = (value: string | number | undefined) => state.set(enumMode && value !== undefined ? chosen(value, prop.default, state.node, prop.name) : value);

  if (values.length === 0)
    return (
      <PropField
        kind={numeric ? "number" : "string"}
        label={label}
        placeholder={member.name}
        value={text ?? ""}
        inputMode={numeric ? "numeric" : undefined}
        onChange={(event) => state.set(typed(event.target.value, numeric))}
      />
    );

  if (enumMode ? isColorEnum(prop.name, values, tokens) : isColorSet(member.name, values, tokens, scale))
    return (
      <PropSelectorsTokenColor
        label={label}
        text={text ?? (enumMode ? "" : member.name)}
        tokens={tokens}
        scale={scale}
        family={enumMode}
        groups={swatchGroups(tokens, values, scale, enumMode ? { family: true } : undefined)}
        value={text === "none" ? undefined : text}
        clearable={enumMode && values.some((value) => String(value) === "none")}
        custom={!enumMode && !!member.free}
        tone={tone}
        onChoose={(value) => choose(enumMode ? (value ?? "none") : value)}
      />
    );

  const shown = text ?? (enumMode ? "" : member.name);
  return (
    <PropSelectorsTokenPicker
      label={label}
      current={held === undefined ? "" : String(held)}
      shown={shown}
      tone={tone}
      options={values.map((value) => ({
        id: String(value),
        label: String(value) + (enumMode && String(value) === unquote(prop.default) ? " (default)" : ""),
        value,
      }))}
      free={member.free ? { numeric } : undefined}
      onChoose={(option) => choose(option.value as string | number | undefined)}
    />
  );
}
