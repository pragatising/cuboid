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
