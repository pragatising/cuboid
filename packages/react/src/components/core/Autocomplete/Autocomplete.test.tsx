import { useState } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { behavesAsFormControl, expectNoAxeViolations } from "../../../test/testing";
import { Autocomplete } from "./Autocomplete";

behavesAsFormControl({
  Component: Autocomplete,
  dataComponent: "Autocomplete",
  props: { value: "", onChange: () => {} },
});

const FRUIT = ["Apple", "Banana", "Cherry"];

function Fruit({
  onSelect,
  openOnFocus,
  items = FRUIT,
  initial = "",
}: {
  onSelect?: (item: HTMLElement) => void;
  openOnFocus?: boolean;
  items?: string[];
  initial?: string;
}) {
  const [value, setValue] = useState(initial);
  const matches = items.filter((name) => name.toLowerCase().includes(value.toLowerCase()));
  return (
    <Autocomplete
      label="Fruit"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onSelect={(item) => {
        setValue(item.textContent ?? "");
        onSelect?.(item);
      }}
      openOnFocus={openOnFocus}
    >
      {matches.map((name) => (
        <Autocomplete.Item key={name}>{name}</Autocomplete.Item>
      ))}
    </Autocomplete>
  );
}

const field = () => screen.getByRole("combobox", { name: "Fruit" });
const option = (name: string) => screen.getByRole("option", { name });

describe("Autocomplete", () => {
  it("is a combobox, closed until the field is used", () => {
    render(<Fruit />);
    expect(field()).toHaveAttribute("aria-expanded", "false");
    expect(field()).toHaveAttribute("aria-haspopup", "listbox");
    expect(field()).toHaveAttribute("aria-autocomplete", "list");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("opens on focus, with the suggestions as a listbox the field controls", async () => {
    render(<Fruit />);
    await userEvent.click(field());
    const list = screen.getByRole("listbox", { name: "Fruit" });
    expect(field()).toHaveAttribute("aria-expanded", "true");
    expect(field()).toHaveAttribute("aria-controls", list.id);
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("does not open on focus with openOnFocus off, but opens when the user types", async () => {
    render(<Fruit openOnFocus={false} />);
    await userEvent.click(field());
    expect(screen.queryByRole("listbox")).toBeNull();
    await userEvent.type(field(), "a");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("opens with ArrowDown when it is closed", async () => {
    render(<Fruit openOnFocus={false} />);
    await userEvent.click(field());
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("filters as the consumer renders, and the first suggestion is active", async () => {
    render(<Fruit />);
    await userEvent.type(field(), "an");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(field()).toHaveAttribute("aria-activedescendant", option("Banana").id);
  });

  it("ArrowDown and ArrowUp move the active suggestion while focus stays in the field", async () => {
    render(<Fruit />);
    await userEvent.click(field());
    expect(field()).toHaveAttribute("aria-activedescendant", option("Apple").id);
    await userEvent.keyboard("{ArrowDown}");
    expect(field()).toHaveAttribute("aria-activedescendant", option("Banana").id);
    await userEvent.keyboard("{ArrowUp}{ArrowUp}");
    expect(field()).toHaveAttribute("aria-activedescendant", option("Cherry").id);
    expect(field()).toHaveFocus();
  });

  it("Enter chooses the active suggestion, closes the list and keeps focus in the field", async () => {
    const onSelect = vi.fn();
    render(<Fruit onSelect={onSelect} />);
    await userEvent.click(field());
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(onSelect.mock.calls[0][0]).toHaveTextContent("Banana");
    expect(field()).toHaveValue("Banana");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(field()).toHaveFocus();
  });

  it("clicking a suggestion chooses it and keeps focus in the field", async () => {
    const onSelect = vi.fn();
    render(<Fruit onSelect={onSelect} />);
    await userEvent.click(field());
    await userEvent.click(option("Cherry"));
    expect(onSelect.mock.calls[0][0]).toHaveTextContent("Cherry");
    expect(field()).toHaveValue("Cherry");
    expect(field()).toHaveFocus();
  });

  it("Escape hides the list but keeps the text and the focus", async () => {
    render(<Fruit initial="app" />);
    await userEvent.click(field());
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(field()).toHaveValue("app");
    expect(field()).toHaveFocus();
  });

  it("Tab hides the list", async () => {
    render(<Fruit />);
    await userEvent.click(field());
    await userEvent.tab();
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("shows no list when nothing matches, and Enter does nothing", async () => {
    const onSelect = vi.fn();
    render(<Fruit onSelect={onSelect} />);
    await userEvent.type(field(), "zzz{Enter}");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(field()).not.toHaveAttribute("aria-activedescendant");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("shows the label, help text and error of the field", () => {
    render(
      <Autocomplete label="Fruit" description="Pick one" error="Required" value="" onChange={() => {}}>
        <Autocomplete.Item>Apple</Autocomplete.Item>
      </Autocomplete>,
    );
    expect(field()).toHaveAccessibleDescription("Pick one Required");
    expect(field()).toHaveAttribute("aria-invalid", "true");
  });

  it("can be controlled", async () => {
    const onOpenChange = vi.fn();
    render(
      <Autocomplete label="Fruit" value="" onChange={() => {}} open onOpenChange={onOpenChange}>
        <Autocomplete.Item>Apple</Autocomplete.Item>
      </Autocomplete>,
    );
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await userEvent.click(option("Apple"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("has no axe violations, open", async () => {
    const { container } = render(<Fruit />);
    await userEvent.click(field());
    await expectNoAxeViolations(container);
    await expectNoAxeViolations(document.querySelector('[data-component="Popover"]') as HTMLElement);
  });
});

describe("Autocomplete: empty", () => {
  function WithEmpty() {
    const [value, setValue] = useState("");
    const matches = FRUIT.filter((name) => name.toLowerCase().includes(value.toLowerCase()));
    return (
      <Autocomplete label="Fruit" value={value} onChange={(event) => setValue(event.target.value)} empty={<div role="status">No results</div>}>
        {matches.map((name) => (
          <Autocomplete.Item key={name}>{name}</Autocomplete.Item>
        ))}
      </Autocomplete>
    );
  }

  it("shows the empty state in place of the list when nothing matches", async () => {
    render(<WithEmpty />);
    await userEvent.type(field(), "zzz");
    expect(screen.getByRole("status")).toHaveTextContent("No results");
    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(field()).toHaveAttribute("aria-expanded", "true");
    expect(field()).not.toHaveAttribute("aria-activedescendant");
  });

  it("keeps aria-controls pointing at the hidden list", async () => {
    render(<WithEmpty />);
    await userEvent.type(field(), "zzz");
    const list = document.getElementById(field().getAttribute("aria-controls") as string);
    expect(list).toBeInTheDocument();
    expect(list).not.toBeVisible();
  });

  it("goes back to the suggestions when the text matches again", async () => {
    render(<WithEmpty />);
    await userEvent.type(field(), "zzz");
    await userEvent.clear(field());
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });
});

describe("Autocomplete: children that render nothing", () => {
  it("shows no list when the children are only null and false", async () => {
    render(
      <Autocomplete label="Fruit" value="" onChange={() => {}}>
        {false}
        {null}
      </Autocomplete>,
    );
    await userEvent.click(field());
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(field()).toHaveAttribute("aria-expanded", "false");
  });
});

describe("Autocomplete: focus leaving and announcements", () => {
  it("closes when focus leaves the field for outside, and calls the consumer's onBlur", async () => {
    const onBlur = vi.fn();
    render(
      <>
        <Autocomplete label="Fruit" value="" onChange={() => {}} onBlur={onBlur}>
          <Autocomplete.Item>Apple</Autocomplete.Item>
        </Autocomplete>
        <button type="button">outside</button>
      </>,
    );
    await userEvent.click(field());
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    act(() => screen.getByRole("button", { name: "outside" }).focus());
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(onBlur).toHaveBeenCalled();
  });

  it("keeps the list open while a suggestion is pressed", async () => {
    const onSelect = vi.fn();
    render(
      <Autocomplete label="Fruit" value="" onChange={() => {}} onSelect={onSelect}>
        <Autocomplete.Item>Apple</Autocomplete.Item>
      </Autocomplete>,
    );
    await userEvent.click(field());
    await userEvent.click(option("Apple"));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("announces how many suggestions there are, once typing pauses", async () => {
    render(<Fruit />);
    await userEvent.click(field());
    const region = () => document.querySelector('[data-component="LiveRegion"]');
    await waitFor(() => expect(region()?.textContent).toBe("3 suggestions available"), { timeout: 3000 });
    await userEvent.type(field(), "an");
    await waitFor(() => expect(region()?.textContent).toBe("1 suggestion available"), { timeout: 3000 });
    await userEvent.type(field(), "zzz");
    await waitFor(() => expect(region()?.textContent).toBe("No suggestions"), { timeout: 3000 });
  });
});

describe("Autocomplete: loading and a create row", () => {
  const live = () => document.querySelector('[data-component="LiveRegion"]');

  it("shows a loading row, and the list is hidden and busy while there is nothing yet", async () => {
    render(
      <Autocomplete label="Fruit" value="" onChange={() => {}} loading>
        {null}
      </Autocomplete>,
    );
    await userEvent.click(field());
    expect(screen.getByText("Loading…")).toBeInTheDocument();
    expect(field()).toHaveAttribute("aria-expanded", "true");
    const list = document.getElementById(field().getAttribute("aria-controls") as string);
    expect(list).toHaveAttribute("aria-busy", "true");
    expect(list).not.toBeVisible();
  });

  it("keeps the suggestions it has while it loads more", async () => {
    render(
      <Autocomplete label="Fruit" value="" onChange={() => {}} loading loadingText="Searching…">
        <Autocomplete.Item>Apple</Autocomplete.Item>
      </Autocomplete>,
    );
    await userEvent.click(field());
    expect(screen.getByText("Searching…")).toBeInTheDocument();
    expect(option("Apple")).toBeInTheDocument();
  });

  it("says it is loading once, then the count when the suggestions arrive", async () => {
    const { rerender } = render(
      <Autocomplete label="Fruit" value="" onChange={() => {}} loading>
        {null}
      </Autocomplete>,
    );
    await userEvent.click(field());
    await waitFor(() => expect(live()?.textContent).toBe("Loading"), { timeout: 3000 });
    rerender(
      <Autocomplete label="Fruit" value="" onChange={() => {}}>
        <Autocomplete.Item>Apple</Autocomplete.Item>
        <Autocomplete.Item>Banana</Autocomplete.Item>
      </Autocomplete>,
    );
    await waitFor(() => expect(live()?.textContent).toBe("2 suggestions available"), { timeout: 3000 });
  });

  it("does not show the empty state while loading", async () => {
    render(
      <Autocomplete label="Fruit" value="" onChange={() => {}} loading empty={<div>Nothing</div>}>
        {null}
      </Autocomplete>,
    );
    await userEvent.click(field());
    expect(screen.queryByText("Nothing")).toBeNull();
  });

  it("a create row is an item the consumer renders, and choosing it works like any other", async () => {
    const onSelect = vi.fn();
    render(
      <Autocomplete label="Fruit" value="kiwi" onChange={() => {}} onSelect={onSelect}>
        <Autocomplete.Item data-create="kiwi" leadingVisual={<svg />}>
          Create “kiwi”
        </Autocomplete.Item>
      </Autocomplete>,
    );
    await userEvent.click(field());
    await userEvent.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0]).toHaveAttribute("data-create", "kiwi");
  });
});
