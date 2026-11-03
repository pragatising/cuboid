import { useState } from "react";
import { Autocomplete, EmptyState } from "@sragatiping/cuboid";
import type { Frame } from "@sragatiping/bench/example";

const FRUIT = ["Apple", "Banana", "Cherry", "Grape", "Lemon", "Mango", "Orange", "Pear"];

export function Default() {
  const [value, setValue] = useState("");
  const matches = FRUIT.filter((name) => name.toLowerCase().includes(value.toLowerCase()));
  return (
    <Autocomplete
      label="Fruit"
      placeholder="Start typing"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onSelect={(item) => setValue(item.textContent ?? "")}
      leadingVisual="search"
      maxHeight="12rem"
      empty={<EmptyState icon="search" heading="No results" description="Try a different word" />}
    >
      {matches.map((name) => (
        <Autocomplete.Item key={name}>{name}</Autocomplete.Item>
      ))}
    </Autocomplete>
  );
}
Default.frame = { width: 280, height: 320 } satisfies Frame;

export function WithSections() {
  const [value, setValue] = useState("");
  return (
    <Autocomplete
      label="Food"
      placeholder="Start typing"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onSelect={(item) => setValue(item.textContent ?? "")}
      openOnFocus
    >
      <Autocomplete.Section label="Fruit">
        <Autocomplete.Item>Apple</Autocomplete.Item>
        <Autocomplete.Item>Pear</Autocomplete.Item>
      </Autocomplete.Section>
      <Autocomplete.Section label="Vegetables">
        <Autocomplete.Item>Carrot</Autocomplete.Item>
        <Autocomplete.Item>Leek</Autocomplete.Item>
      </Autocomplete.Section>
    </Autocomplete>
  );
}
WithSections.frame = { width: 280, height: 320 } satisfies Frame;

export function Loading() {
  return (
    <Autocomplete label="Fruit" placeholder="Start typing" defaultOpen loading loadingText="Searching…">
      {null}
    </Autocomplete>
  );
}
Loading.frame = { width: 280, height: 240 } satisfies Frame;

export function WithError() {
  return (
    <Autocomplete label="Fruit" error="Choose one of the fruit listed." defaultValue="Dragon">
      <Autocomplete.Item>Apple</Autocomplete.Item>
    </Autocomplete>
  );
}
