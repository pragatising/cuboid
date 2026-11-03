import React, { useState } from "react";
import { ActionMenu } from "../../../../../../ui/index";
import type { Value } from "../../../../../../engine/types";
import { TypeSignature } from "../TypeSignature";
import { SelectChip } from "../../../../SelectChip";

/** The most items a list shows at once: a set of thousands (icon names) is searched, not scrolled. */
const SHOWN = 100;

export type PickerOption = { id: string; label: string; value: Value | undefined };

/**
 * A chip that opens a list to choose from, as a select does: the one in use is checked. Nothing changes until something is chosen. A long
 * list has a search field, and where the type also takes a typed value (`free`) what is typed can be used as it is.
 */
export function PropSelectorsTokenPicker({
  label,
  current,
  shown,
  tone,
  options,
  free,
  onChoose,
}: {
  label: string;
  current: string;
  shown: string;
  tone?: "type" | "string" | "number";
  options: PickerOption[];
  free?: { numeric: boolean };
  onChoose: (option: PickerOption) => void;
}) {
  const [query, setQuery] = useState("");
  const searchable = options.length > 12 || !!free;
  const needle = query.trim().toLowerCase();
  const matching = needle ? options.filter((option) => option.label.toLowerCase().includes(needle)) : options;
  const typed = query.trim();
  const own = free && typed && !options.some((option) => option.id === typed);
  const parsed: Value = free?.numeric && Number.isFinite(Number(typed)) ? Number(typed) : typed;
  return (
    <ActionMenu
      aria-label={label}
      selectionMode="single"
      placement="bottom-start"
      maxHeight="20rem"
      onOpenChange={(open) => !open && setQuery("")}
      trigger={
        <SelectChip tone={tone} aria-label={`${label}: ${shown}`}>
          {tone === "type" ? <TypeSignature type={shown} /> : shown}
        </SelectChip>
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
        <ActionMenu.Item key="own" onClick={() => onChoose({ id: typed, label: typed, value: parsed })}>
          Use “{typed}”
        </ActionMenu.Item>
      ) : null}
      {matching.slice(0, SHOWN).map((option) => (
        <ActionMenu.Item key={option.id} selected={option.id === current} onClick={() => onChoose(option)}>
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
