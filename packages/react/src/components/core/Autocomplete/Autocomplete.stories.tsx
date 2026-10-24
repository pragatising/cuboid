import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { EmptyState } from "../EmptyState";
import { Icon } from "../Icon";
import { Autocomplete } from "./Autocomplete";

const meta: Meta<typeof Autocomplete> = {
  title: "Core/Autocomplete",
  component: Autocomplete,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  decorators: [(Story) => <div style={{ maxWidth: "16rem", minHeight: "16rem" }}>{Story()}</div>],
};
export default meta;
type Story = StoryObj<typeof Autocomplete>;

const FRUIT = ["Apple", "Banana", "Cherry", "Grape", "Lemon", "Mango", "Orange", "Pear"];

export const Default: Story = {
  render: function DefaultStory() {
    const [value, setValue] = useState("");
    const matches = FRUIT.filter((name) => name.toLowerCase().includes(value.toLowerCase()));
    return (
      <Autocomplete
        label="Fruit"
        placeholder="Start typing"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onSelect={(item) => setValue(item.textContent ?? "")}
        leadingVisual={<Icon name="search" />}
        maxHeight="12rem"
        empty={<EmptyState icon="search" heading="No results" description="Try a different word" />}
      >
        {matches.map((name) => (
          <Autocomplete.Item key={name}>{name}</Autocomplete.Item>
        ))}
      </Autocomplete>
    );
  },
};

export const WithDescriptions: Story = {
  name: "Items with descriptions",
  render: function DescribedStory() {
    const [value, setValue] = useState("");
    const people = [
      { name: "Ada Lovelace", role: "Mathematician" },
      { name: "Grace Hopper", role: "Computer scientist" },
      { name: "Katherine Johnson", role: "Mathematician" },
    ].filter((person) => person.name.toLowerCase().includes(value.toLowerCase()));
    return (
      <Autocomplete label="Person" value={value} onChange={(event) => setValue(event.target.value)} onSelect={(item) => setValue(item.querySelector('[data-component="ActionList.Label"]')?.textContent ?? "")}>
        {people.map((person) => (
          <Autocomplete.Item key={person.name} description={person.role}>
            {person.name}
          </Autocomplete.Item>
        ))}
      </Autocomplete>
    );
  },
};

export const Loading: Story = {
  name: "Loading suggestions",
  render: function LoadingStory() {
    const [value, setValue] = useState("");
    const [loading, setLoading] = useState(true);
    const matches = loading ? [] : FRUIT.filter((name) => name.toLowerCase().includes(value.toLowerCase()));
    return (
      <Autocomplete
        label="Fruit"
        placeholder="Click, then wait a second"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setLoading(true);
          setTimeout(() => setLoading(false), 800);
        }}
        onSelect={(item) => setValue(item.textContent ?? "")}
        loading={loading}
        onFocus={() => loading && setTimeout(() => setLoading(false), 1500)}
      >
        {matches.map((name) => (
          <Autocomplete.Item key={name}>{name}</Autocomplete.Item>
        ))}
      </Autocomplete>
    );
  },
};

export const CreateNew: Story = {
  name: "A create-new row",
  render: function CreateStory() {
    const [value, setValue] = useState("");
    const [added, setAdded] = useState<string[]>([]);
    const all = [...FRUIT, ...added];
    const matches = all.filter((name) => name.toLowerCase().includes(value.toLowerCase()));
    const exact = all.some((name) => name.toLowerCase() === value.trim().toLowerCase());
    return (
      <Autocomplete
        label="Fruit"
        description="Type a fruit that is not in the list, then choose Create."
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onSelect={(item) => {
          if (item.dataset.create) setAdded((now) => [...now, item.dataset.create as string]);
          setValue(item.dataset.create ?? item.querySelector('[data-component="ActionList.Label"]')?.textContent ?? "");
        }}
      >
        {matches.map((name) => (
          <Autocomplete.Item key={name}>{name}</Autocomplete.Item>
        ))}
        {value.trim() && !exact ? (
          <Autocomplete.Item data-create={value.trim()} leadingVisual={<Icon name="add" />}>
            Create “{value.trim()}”
          </Autocomplete.Item>
        ) : null}
      </Autocomplete>
    );
  },
};

export const NothingMatches: Story = {
  name: "Nothing matches (empty state)",
  render: function EmptyStory() {
    const [value, setValue] = useState("zzz");
    const matches = FRUIT.filter((name) => name.toLowerCase().includes(value.toLowerCase()));
    return (
      <Autocomplete label="Fruit" value={value} onChange={(event) => setValue(event.target.value)} empty={<EmptyState icon="search" heading="No results" description="Try a different word" />}>
        {matches.map((name) => (
          <Autocomplete.Item key={name}>{name}</Autocomplete.Item>
        ))}
      </Autocomplete>
    );
  },
};
