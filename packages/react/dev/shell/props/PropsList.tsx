import React, { useState } from "react";
import {
  ActionMenu,
  Icon,
  Switch,
  SwatchPicker,
  VisuallyHidden,
  useTokens,
} from "../../../src";
import type { Tokens } from "../../../src/mode";
import { resolveSyntaxColors } from "../../../src/components/CodeBlock/syntaxColors";
import type { SyntaxColors } from "../../../src/components/CodeBlock/syntaxColors";
import components from "../../generated/components.json";
import tokenSets from "../../generated/token-sets.json";
import { humanise, parseDefault } from "../../engine/domains";
import type { Node, PropDoc, Value } from "../../engine/types";
import { fixtures } from "../playground/host";
import { nameOf, slotCandidates } from "./candidates";
import {
  isColorEnum,
  isColorSet,
  scaleOf,
  swatchColor,
  swatchGroups,
} from "./colors";
import type { Scale } from "./colors";
import { needsOutline } from "../../../src/utils/outline";
import { useProps } from "./PropsContext";
import { chosen, setValue, shownValue } from "./overrides";
import classes from "./PropsList.module.css";

/** A part of a prop's type that is a set of values (named, like `FgColor`, or loose) and/or a shape that is typed (`#…`, a number). */
type Member = {
  name: string;
  set?: string;
  values?: (string | number)[];
  free?: string[];
};

/** A prop as `components.json` has it, from the component's own types. */
type Prop = {
  name: string;
  required?: boolean;
  type: string;
  kind: string;
  values?: (string | number)[];
  default?: string;
  description?: string;
  members?: Member[];
};

const SETS = tokenSets as unknown as Record<string, (string | number)[]>;
const valuesOf = (member: Member) =>
  (member.set ? SETS[member.set] : member.values) ?? [];

const PROPS = components as unknown as Record<string, { props: Prop[] }>;

/** `"md"` as written in the source is `md`: what the chips and the default are compared in. */
const unquote = (source: string | undefined) =>
  source?.replace(/^["'](.*)["']$/, "$1");

/** `((value: string) => void)` is `(value: string) => void`: the outer pair is the type's own wrapping. */
const unwrap = (type: string) =>
  /^\((.*)\)$/.test(type) && !/^\([^()]*\)$/.test(type) && /=>/.test(type)
    ? type.slice(1, -1)
    : type;

/** Splits at the commas that are not inside brackets: `a: Map<K, V>, b: string` is two. */
function topLevel(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let from = 0;
  for (let i = 0; i < text.length; i++) {
    if ("(<[{".includes(text[i])) depth++;
    else if (
      ")>]}".includes(text[i]) &&
      !(text[i] === ">" && text[i - 1] === "=")
    )
      depth--;
    else if (text[i] === "," && depth === 0) {
      parts.push(text.slice(from, i).trim());
      from = i + 1;
    }
  }
  const last = text.slice(from).trim();
  return last ? [...parts, last] : parts;
}

/** `(item: HTMLElement) => void` as its parts, or null when it is not a function type this can read. */
function functionOf(
  type: string,
): { params: { name?: string; type: string }[]; returns: string } | null {
  const text = unwrap(type);
  if (!text.startsWith("(")) return null;
  let depth = 0;
  let close = -1;
  for (let i = 0; i < text.length && close === -1; i++) {
    if (text[i] === "(") depth++;
    else if (text[i] === ")" && --depth === 0) close = i;
  }
  const rest =
    close === -1 ? null : /^\s*=>\s*(.+)$/s.exec(text.slice(close + 1));
  if (!rest) return null;
  const params = topLevel(text.slice(1, close)).map((param) => {
    const split = /^([\w$.]+\??)\s*:\s*(.+)$/s.exec(param);
    return split ? { name: split[1], type: split[2] } : { type: param };
  });
  return { params, returns: rest[1].trim() };
}

/**
 * The component's properties (Figma 3374:32985), one row each, from its types: a choice is its values in a tray with the one in use lifted,
 * an on/off prop a switch, text a chip you type in, a slot a chip, and a function written out. `?:` says it is optional. In the Playground
 * each control changes the example, and the code beside it; elsewhere they say the same and change nothing.
 */
export function PropsList({ component }: { component: string }) {
  const tokens = useTokens();
  const syntax = resolveSyntaxColors(tokens);
  const play = useProps();
  const props = PROPS[component]?.props ?? [];
  // Only the example of the component the pane is for can be changed.
  const live = play?.base?.component === component ? play : null;

  if (props.length === 0) {
    return (
      <p className={classes.Empty}>{component} has no props of its own.</p>
    );
  }

  return (
    <ul
      className={classes.List}
      style={{
        ["--name" as string]: syntax.componentTag,
        ["--type" as string]: syntax.componentTag,
        ["--string" as string]: syntax.string,
        ["--number" as string]: syntax.numberLiteral,
        ["--keyword" as string]: syntax.keyword,
        ["--function" as string]: syntax.bracket,
      }}
      aria-label={`${component} properties`}
    >
      {props.map((prop) => (
        <li key={prop.name} className={classes.Row}>
          <span
            className={classes.Name}
            data-function={
              prop.kind === "event" || prop.kind === "function" ? "" : undefined
            }
            title={prop.description}
          >
            {prop.name}
            {prop.required ? (
              <VisuallyHidden> (required)</VisuallyHidden>
            ) : null}
          </span>
          <span className={classes.Colon} aria-hidden="true">
            {prop.required ? ":" : "?:"}
          </span>
          <Control prop={prop} live={live} syntax={syntax} />
        </li>
      ))}
    </ul>
  );
}

type Live = NonNullable<ReturnType<typeof useProps>>;

function Control({
  prop,
  live,
  syntax,
}: {
  prop: Prop;
  live: Live | null;
  syntax: SyntaxColors;
}) {
  const doc: PropDoc | undefined = live?.base?.doc.props.find(
    (p) => p.name === prop.name,
  );
  const node: Node | null = live?.base?.node ?? null;
  const overrides = live?.overrides ?? {};
  // What the engine calls state (`value`, `defaultValue`) the app holds: changing it here would make the component controlled with no one to answer.
  const editable = !!live && !!doc && doc.kind !== "state" && !!node;
  const set = (value: Value | undefined) => live?.change(prop.name, value);

  const tokens = useTokens();

  // A choice of colours is a swatch to choose from, not a word.
  if (
    prop.kind === "enum" &&
    prop.values?.length &&
    editable &&
    isColorEnum(prop.name, prop.values, tokens)
  ) {
    const shown = String(
      shownValue(prop.name, node, overrides, prop.default) ?? "",
    );
    const hasNone = prop.values.some((value) => String(value) === "none");
    return (
      <ColorChip
        label={prop.name}
        text={shown}
        tokens={tokens}
        scale={scaleOf(prop.name)}
        family
        groups={swatchGroups(tokens, prop.values, scaleOf(prop.name), {
          family: true,
        })}
        value={shown === "none" ? undefined : shown}
        clearable={hasNone}
        onChoose={(value) =>
          set(chosen(value ?? "none", prop.default, node, prop.name))
        }
      />
    );
  }

  // Where nothing is being played with, a long choice is still one chip that says what is chosen, as it is where it can be changed.
  if (
    prop.kind === "enum" &&
    prop.values &&
    prop.values.length > TRAY &&
    !editable
  ) {
    const shown = String(
      shownValue(prop.name, node, overrides, prop.default) ?? "",
    );
    const colour = isColorEnum(prop.name, prop.values, tokens)
      ? swatchColor(tokens, shown, scaleOf(prop.name), true)
      : null;
    return (
      <span
        className={classes.Chip}
        data-select=""
        title={prop.values.join(", ")}
      >
        {isColorEnum(prop.name, prop.values, tokens) ? (
          <span
            className={classes.Dot}
            data-empty={colour ? undefined : ""}
            data-outline={colour && needsOutline(colour) ? "" : undefined}
            style={
              colour
                ? ({ "--swatch": colour } as React.CSSProperties)
                : undefined
            }
          />
        ) : null}
        {shown}
        <Icon name="keyboard_arrow_down" size="xs" aria-hidden="true" />
      </span>
    );
  }

  if (prop.kind === "enum" && prop.values?.length) {
    const shown = shownValue(prop.name, node, overrides, prop.default);
    const pick = (value: string | number) =>
      set(chosen(value, prop.default, node, prop.name));
    // Up to four values sit side by side in a tray; more would not fit, and are a list to choose from.
    if (editable && prop.values.length > TRAY)
      return (
        <Picker
          label={prop.name}
          current={String(shown ?? "")}
          shown={String(shown ?? "")}
          options={prop.values.map((value) => ({
            id: String(value),
            label:
              String(value) +
              (String(value) === unquote(prop.default) ? " (default)" : ""),
            value,
          }))}
          onChoose={(option) => pick(option.value as string | number)}
        />
      );
    return (
      <span
        className={classes.Tray}
        role={editable ? "radiogroup" : "group"}
        aria-label={prop.name}
      >
        {prop.values.map((value) => {
          const on = String(shown) === String(value);
          const label = (
            <>
              {String(value)}
              {String(value) === unquote(prop.default) ? (
                <VisuallyHidden> (default)</VisuallyHidden>
              ) : null}
            </>
          );
          return editable ? (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={on}
              className={classes.Choice}
              data-on={on ? "" : undefined}
              onClick={() => pick(value)}
            >
              {label}
            </button>
          ) : (
            <span
              key={value}
              className={classes.Choice}
              data-on={on ? "" : undefined}
            >
              {label}
            </span>
          );
        })}
      </span>
    );
  }

  if (prop.kind === "flag") {
    const on = shownValue(prop.name, node, overrides, prop.default) === true;
    const standard = parseDefault(prop.default) === true;
    return editable ? (
      <Switch
        checked={on}
        aria-label={prop.name}
        onCheckedChange={(next) =>
          set(
            next === standard && node?.props?.[prop.name] === undefined
              ? undefined
              : next,
          )
        }
      />
    ) : (
      <Switch
        readOnly
        checked={on}
        aria-label={`${prop.name}, ${on ? "on" : "off"} by default`}
      />
    );
  }

  if (prop.kind === "slot") {
    const current = setValue(prop.name, node, overrides);
    if (prop.name === "children") {
      // Content that is text is typed. Content made of components (a menu's list, a table's rows) is made of the component's own parts.
      const parts =
        Array.isArray(current) && current.some((c) => typeof c === "object");
      const text =
        typeof current === "string"
          ? current
          : Array.isArray(current) &&
              current.every((c) => typeof c === "string")
            ? current.join("")
            : "";
      return editable && !parts ? (
        <TextChip
          value={text}
          placeholder="React.ReactNode"
          color="--string"
          label={prop.name}
          onChange={(next) => set(next === "" ? undefined : next)}
        />
      ) : (
        <span
          className={classes.Chip}
          data-type=""
          title={parts ? "Made of the component's own parts" : undefined}
        >
          React.ReactNode
        </span>
      );
    }
    if (!editable)
      return (
        <span className={classes.Chip} data-type="">
          React.ReactNode
        </span>
      );
    // Opening the list changes nothing; the example changes when something is chosen. A slot that must be filled has no "None".
    const name = nameOf(current);
    const options: Option[] = [
      ...(prop.required
        ? []
        : [{ id: "none", label: "None", value: undefined }]),
      ...slotCandidates(
        live!.base!.component,
        live!.base!.node,
        prop.name,
        !!doc?.element,
      ),
    ];
    return (
      <Picker
        label={prop.name}
        current={name ?? "none"}
        shown={name ?? "React.ReactNode"}
        type
        options={options}
        onChoose={(option) => set(option.value)}
      />
    );
  }

  // A type made of sets of values and shapes to type: each part is a chip of its own, and one of them holds the value (`FgColor ⌄ | CssColor ⌄`).
  if (prop.members?.length && ["value", "other", "open"].includes(prop.kind)) {
    const current = setValue(prop.name, node, overrides);
    return (
      <Members
        prop={prop}
        members={prop.members}
        current={
          typeof current === "string" || typeof current === "number"
            ? current
            : undefined
        }
        tokens={tokens}
        editable={editable}
        onChange={(value) => set(value)}
      />
    );
  }

  if (prop.kind === "value") {
    const numeric = prop.type === "number";
    const current = setValue(prop.name, node, overrides);
    const shown =
      typeof current === "string" || typeof current === "number"
        ? String(current)
        : "";
    if (!editable)
      return (
        <span className={classes.Chip} data-type="" title={prop.type}>
          {prop.type}
        </span>
      );
    return (
      <TextChip
        value={shown}
        placeholder={prop.type}
        color={numeric ? "--number" : "--string"}
        label={prop.name}
        inputMode={numeric ? "numeric" : undefined}
        onChange={(next) =>
          set(
            next === ""
              ? undefined
              : numeric && Number.isFinite(Number(next))
                ? Number(next)
                : next,
          )
        }
      />
    );
  }

  const fn =
    prop.kind === "event" || prop.kind === "function"
      ? functionOf(prop.type)
      : null;
  if (fn)
    return (
      <span className={classes.Function} title={prop.type}>
        <span style={{ color: syntax.keyword }}>(</span>
        {fn.params.map((param, index) => (
          <React.Fragment key={index}>
            {index > 0 ? <span className={classes.Comma}>, </span> : null}
            {param.name ? (
              <span style={{ color: syntax.numberLiteral }}>
                {param.name}:{" "}
              </span>
            ) : null}
            <span style={{ color: syntax.componentTag }}>{param.type}</span>
          </React.Fragment>
        ))}
        <span style={{ color: syntax.keyword }}>)</span>
        <span className={classes.Arrow}> =&gt; </span>
        <span style={{ color: syntax.componentTag }}>{fn.returns}</span>
      </span>
    );

  // A ref, a name from a large set, an alias or a type the types say more about than a word: the type, as written.
  return (
    <span className={classes.Chip} data-type="" title={prop.type}>
      {unwrap(prop.type)}
    </span>
  );
}

/** The most values a tray holds. */
const TRAY = 4;
/** The most items a list shows at once: a set of thousands (icon names) is searched, not scrolled. */
const SHOWN = 100;

type Option = { id: string; label: string; value: Value | undefined };

/**
 * A chip that opens a list to choose from, as a select does: the one in use is checked. Nothing changes until something is chosen. A long
 * list has a search field, and where the type also takes a typed value (`free`) what is typed can be used as it is. `type` writes the chip in
 * the colour of a type (a slot's), otherwise it is a value (a choice's).
 */
function Picker({
  label,
  current,
  shown,
  options,
  type,
  free,
  onChoose,
}: {
  label: string;
  current: string;
  shown: string;
  options: Option[];
  type?: boolean;
  free?: { numeric: boolean };
  onChoose: (option: Option) => void;
}) {
  const [query, setQuery] = useState("");
  const searchable = options.length > 12 || !!free;
  const needle = query.trim().toLowerCase();
  const matching = needle
    ? options.filter((option) => option.label.toLowerCase().includes(needle))
    : options;
  const typed = query.trim();
  const own = free && typed && !options.some((option) => option.id === typed);
  const parsed: Value =
    free?.numeric && Number.isFinite(Number(typed)) ? Number(typed) : typed;
  return (
    <ActionMenu
      aria-label={label}
      selectionMode="single"
      placement="bottom-start"
      maxHeight="20rem"
      onOpenChange={(open) => !open && setQuery("")}
      trigger={
        <button
          type="button"
          className={classes.Chip}
          data-type={type ? "" : undefined}
          data-select=""
          aria-label={`${label}: ${shown}`}
        >
          {shown}
          <Icon name="keyboard_arrow_down" size="xs" aria-hidden="true" />
        </button>
      }
    >
      {searchable ? (
        <ActionMenu.Search
          aria-label={`Search ${label}`}
          placeholder={free ? "Search or type a value" : "Search"}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      ) : null}
      {own ? (
        <ActionMenu.Item
          key="own"
          onClick={() => onChoose({ id: typed, label: typed, value: parsed })}
        >
          Use “{typed}”
        </ActionMenu.Item>
      ) : null}
      {matching.slice(0, SHOWN).map((option) => (
        <ActionMenu.Item
          key={option.id}
          selected={option.id === current}
          onClick={() => onChoose(option)}
        >
          {option.label}
        </ActionMenu.Item>
      ))}
      {matching.length > SHOWN ? (
        <ActionMenu.Item key="more" disabled>
          {matching.length - SHOWN} more: type to narrow
        </ActionMenu.Item>
      ) : null}
    </ActionMenu>
  );
}

/** A colour chip: the colour as a dot, its name, and a chevron, opening Cuboid's own swatches to choose from (and, where it is allowed, any CSS colour). */
function ColorChip({
  label,
  text,
  tokens,
  scale,
  family,
  groups,
  value,
  clearable,
  allowCustom,
  onChoose,
}: {
  label: string;
  text: string;
  tokens: Tokens;
  scale: Scale;
  family?: boolean;
  groups: ReturnType<typeof swatchGroups>;
  value: string | undefined;
  clearable?: boolean;
  allowCustom?: boolean;
  onChoose: (value: string | undefined) => void;
}) {
  const color = text ? swatchColor(tokens, text, scale, family) : null;
  return (
    <SwatchPicker
      aria-label={label}
      groups={groups}
      value={value}
      clearable={clearable}
      allowCustom={allowCustom}
      onValueChange={onChoose}
      trigger={
        <button
          type="button"
          className={classes.Chip}
          data-select=""
          data-type={text ? undefined : ""}
          aria-label={`${label}: ${text || "none"}`}
        >
          <span
            className={classes.Dot}
            data-empty={color ? undefined : ""}
            data-outline={color && needsOutline(color) ? "" : undefined}
            style={
              color ? ({ "--swatch": color } as React.CSSProperties) : undefined
            }
          />
          {text}
          <Icon name="keyboard_arrow_down" size="xs" aria-hidden="true" />
        </button>
      }
    />
  );
}

/** The parts of a type that is several: the one holding the value shows it, the others show what they are. A thin rule sits between them. */
function Members({
  prop,
  members,
  current,
  tokens,
  editable,
  onChange,
}: {
  prop: Prop;
  members: Member[];
  current: string | number | undefined;
  tokens: Tokens;
  editable: boolean;
  onChange: (value: Value | undefined) => void;
}) {
  const scale = scaleOf(prop.name);
  const text = current === undefined ? undefined : String(current);
  // The set the value is in holds it; a value in none of them (typed) is the first part that takes a typed value.
  const owner =
    text === undefined
      ? -1
      : members.findIndex((member) =>
            valuesOf(member).some((value) => String(value) === text),
          ) !== -1
        ? members.findIndex((member) =>
            valuesOf(member).some((value) => String(value) === text),
          )
        : members.findIndex((member) => member.free);
  return (
    <span className={classes.Members}>
      {members.map((member, index) => {
        const values = valuesOf(member);
        const holds = index === owner;
        const shown = holds && text !== undefined ? text : member.name;
        const numeric = !!member.free?.includes("number");
        const parts = [
          index > 0 ? (
            <span key="rule" className={classes.Rule} aria-hidden="true" />
          ) : null,
          !editable ? (
            <span key="m" className={classes.Chip} data-type="">
              {member.name}
              <Icon name="keyboard_arrow_down" size="xs" aria-hidden="true" />
            </span>
          ) : values.length === 0 ? (
            <TextChip
              key="m"
              value={holds && text !== undefined ? text : ""}
              placeholder={member.free?.[0] ?? member.name}
              color="--string"
              label={`${prop.name}: ${member.name}`}
              inputMode={numeric ? "numeric" : undefined}
              onChange={(next) =>
                onChange(
                  next === ""
                    ? undefined
                    : numeric && Number.isFinite(Number(next))
                      ? Number(next)
                      : next,
                )
              }
            />
          ) : isColorSet(member.name, values, tokens, scale) ? (
            <ColorChip
              key="m"
              label={`${prop.name}: ${member.name}`}
              text={shown}
              tokens={tokens}
              scale={scale}
              groups={swatchGroups(tokens, values, scale)}
              value={holds ? text : undefined}
              allowCustom={!!member.free}
              onChoose={(value) => onChange(value)}
            />
          ) : (
            <Picker
              key="m"
              label={`${prop.name}: ${member.name}`}
              current={holds && text !== undefined ? text : ""}
              shown={shown}
              options={values.map((value) => ({
                id: String(value),
                label: String(value),
                value,
              }))}
              free={member.free ? { numeric } : undefined}
              onChoose={(option) => onChange(option.value)}
            />
          ),
        ];
        return (
          <React.Fragment key={`${member.name}-${index}`}>
            {parts}
          </React.Fragment>
        );
      })}
    </span>
  );
}

/** A chip you type in: the string in the colour of a string, empty to take the prop off. */
function TextChip({
  value,
  placeholder,
  color,
  label,
  inputMode,
  onChange,
}: {
  value: string;
  placeholder: string;
  color: string;
  label: string;
  inputMode?: "numeric";
  onChange: (next: string) => void;
}) {
  return (
    <input
      className={classes.Text}
      style={{
        color: `var(${color})`,
        width: `${Math.max(value.length || placeholder.length, 4) + 1}ch`,
      }}
      value={value}
      placeholder={placeholder}
      aria-label={label}
      inputMode={inputMode}
      spellCheck={false}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
