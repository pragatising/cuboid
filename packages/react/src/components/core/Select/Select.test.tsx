import { useState } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { behavesAsFormControl, expectNoAxeViolations } from "../../../test/testing";
import { Select } from "./Select";

behavesAsFormControl({
  Component: Select,
  dataComponent: "Select",
  props: { children: <Select.Option value="a">A</Select.Option> },
});

function Fruit({ onValueChange, ...props }: { onValueChange?: (value: string) => void } & Partial<React.ComponentProps<typeof Select>>) {
  return (
    <Select label="Fruit" placeholder="Choose one" onValueChange={onValueChange} {...props}>
      <Select.Option value="apple">Apple</Select.Option>
      <Select.Option value="banana">Banana</Select.Option>
      <Select.Option value="cherry" disabled>
        Cherry
      </Select.Option>
      <Select.Option value="grape">Grape</Select.Option>
    </Select>
  );
}

const box = () => screen.getByRole("combobox", { name: "Fruit" });
const option = (name: string) => screen.getByRole("option", { name });
const listbox = () => screen.queryByRole("listbox");

describe("Select: the field", () => {
  it("is a combobox named by its label, closed, showing the placeholder", () => {
    render(<Fruit />);
    expect(box()).toHaveAttribute("aria-haspopup", "listbox");
    expect(box()).toHaveAttribute("aria-expanded", "false");
    expect(box()).toHaveTextContent("Choose one");
    expect(box()).toHaveAttribute("data-placeholder");
    expect(listbox()).toBeNull();
  });

  it("shows the label of the chosen option, including one inside a section", () => {
    const { rerender } = render(<Fruit defaultValue="banana" />);
    expect(box()).toHaveTextContent("Banana");
    expect(box()).not.toHaveAttribute("data-placeholder");
    rerender(
      <Select label="Fruit" value="b">
        <Select.Section label="Group">
          <Select.Option value="b">Inside</Select.Option>
        </Select.Section>
      </Select>,
    );
    expect(box()).toHaveTextContent("Inside");
  });

  it("shows the description and error, described, and marks it invalid", () => {
    render(<Fruit description="Pick one" error="Required" />);
    expect(box()).toHaveAccessibleDescription("Pick one Required");
    expect(box()).toHaveAttribute("aria-invalid", "true");
  });

  it("takes an aria-label when there is no label", () => {
    render(
      <Select aria-label="Colour">
        <Select.Option value="r">Red</Select.Option>
      </Select>,
    );
    expect(screen.getByRole("combobox", { name: "Colour" })).toBeInTheDocument();
  });

  it("submits the value under its name", () => {
    const { container } = render(<Fruit name="fruit" defaultValue="grape" />);
    expect(container.querySelector('input[type="hidden"][name="fruit"]')).toHaveValue("grape");
  });

  it("defaults to size md, and size is an attribute on the shell", () => {
    const { container, rerender } = render(<Fruit />);
    const shell = () => container.querySelector('[data-component="InputField.Shell"]');
    expect(shell()).toHaveAttribute("data-size", "md");
    rerender(<Fruit size="lg" />);
    expect(shell()).toHaveAttribute("data-size", "lg");
  });
});

describe("Select: opening and choosing", () => {
  it("opens on click into a listbox of options, the chosen one selected and active", async () => {
    render(<Fruit defaultValue="grape" />);
    await userEvent.click(box());
    const list = screen.getByRole("listbox", { name: "Fruit" });
    expect(box()).toHaveAttribute("aria-expanded", "true");
    expect(box()).toHaveAttribute("aria-controls", list.id);
    expect(screen.getAllByRole("option")).toHaveLength(4);
    expect(option("Grape")).toHaveAttribute("aria-selected", "true");
    expect(option("Apple")).toHaveAttribute("aria-selected", "false");
    expect(box()).toHaveAttribute("aria-activedescendant", option("Grape").id);
  });

  it("the first option is active when nothing is chosen", async () => {
    render(<Fruit />);
    await userEvent.click(box());
    expect(box()).toHaveAttribute("aria-activedescendant", option("Apple").id);
  });

  it.each(["{ArrowDown}", "{ArrowUp}", "{Enter}", " "])("opens with %s", async (key) => {
    render(<Fruit />);
    box().focus();
    await userEvent.keyboard(key);
    expect(listbox()).toBeInTheDocument();
  });

  it("clicking an option chooses it, closes, and keeps focus on the select", async () => {
    const onValueChange = vi.fn();
    render(<Fruit onValueChange={onValueChange} />);
    await userEvent.click(box());
    await userEvent.click(option("Banana"));
    expect(onValueChange).toHaveBeenCalledWith("banana");
    expect(box()).toHaveTextContent("Banana");
    expect(listbox()).toBeNull();
    expect(box()).toHaveFocus();
  });

  it("the arrows move the active option, skip disabled ones and wrap, while focus stays on the select", async () => {
    render(<Fruit />);
    await userEvent.click(box());
    await userEvent.keyboard("{ArrowDown}");
    expect(box()).toHaveAttribute("aria-activedescendant", option("Banana").id);
    await userEvent.keyboard("{ArrowDown}");
    expect(box()).toHaveAttribute("aria-activedescendant", option("Grape").id);
    await userEvent.keyboard("{ArrowDown}");
    expect(box()).toHaveAttribute("aria-activedescendant", option("Apple").id);
    expect(box()).toHaveFocus();
  });

  it("Home and End jump to the first and last option", async () => {
    render(<Fruit />);
    await userEvent.click(box());
    await userEvent.keyboard("{End}");
    expect(box()).toHaveAttribute("aria-activedescendant", option("Grape").id);
    await userEvent.keyboard("{Home}");
    expect(box()).toHaveAttribute("aria-activedescendant", option("Apple").id);
  });

  it.each(["{Enter}", " "])("%s chooses the active option", async (key) => {
    const onValueChange = vi.fn();
    render(<Fruit onValueChange={onValueChange} />);
    await userEvent.click(box());
    await userEvent.keyboard(`{ArrowDown}${key}`);
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("banana");
    expect(listbox()).toBeNull();
  });

  it("a disabled option cannot be chosen", async () => {
    const onValueChange = vi.fn();
    render(<Fruit onValueChange={onValueChange} />);
    await userEvent.click(box());
    await userEvent.click(option("Cherry"));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("Escape closes and keeps focus on the select without changing the value", async () => {
    render(<Fruit defaultValue="apple" />);
    await userEvent.click(box());
    await userEvent.keyboard("{ArrowDown}{Escape}");
    expect(listbox()).toBeNull();
    expect(box()).toHaveFocus();
    expect(box()).toHaveTextContent("Apple");
  });

  it("Tab closes", async () => {
    render(<Fruit />);
    await userEvent.click(box());
    await userEvent.tab();
    expect(listbox()).toBeNull();
  });

  it("clicking the select again closes it, and a press outside closes it", async () => {
    render(
      <>
        <Fruit />
        <button type="button">outside</button>
      </>,
    );
    await userEvent.click(box());
    await userEvent.click(box());
    expect(listbox()).toBeNull();
    await userEvent.click(box());
    await userEvent.click(screen.getByRole("button", { name: "outside" }));
    expect(listbox()).toBeNull();
  });

  it("can be controlled", async () => {
    function Controlled() {
      const [value, setValue] = useState("apple");
      return (
        <>
          <Fruit value={value} onValueChange={setValue} />
          <button type="button" onClick={() => setValue("grape")}>
            set
          </button>
        </>
      );
    }
    render(<Controlled />);
    expect(box()).toHaveTextContent("Apple");
    await userEvent.click(screen.getByRole("button", { name: "set" }));
    expect(box()).toHaveTextContent("Grape");
    await userEvent.click(box());
    await userEvent.click(option("Banana"));
    expect(box()).toHaveTextContent("Banana");
  });
});

describe("Select: disabled and read-only", () => {
  it("disabled cannot be opened", async () => {
    const { container } = render(<Fruit disabled />);
    expect(box()).toBeDisabled();
    expect(container.querySelector('[data-component="InputField.Shell"]')).toHaveAttribute("data-disabled");
    await userEvent.click(box());
    expect(listbox()).toBeNull();
  });

  it("read-only shows the value but does not open", async () => {
    const { container } = render(<Fruit readOnly defaultValue="apple" />);
    expect(box()).toHaveAttribute("aria-readonly", "true");
    expect(container.querySelector('[data-component="InputField.Shell"]')).toHaveAttribute("data-readonly");
    await userEvent.click(box());
    box().focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(listbox()).toBeNull();
    expect(box()).toHaveTextContent("Apple");
  });
});

describe("Select: accessibility", () => {
  it("has no axe violations, closed", async () => {
    const { container } = render(<Fruit description="Help" error="Required" />);
    await expectNoAxeViolations(container);
  });

  it("has no axe violations, open", async () => {
    const { container } = render(<Fruit />);
    await userEvent.click(box());
    await expectNoAxeViolations(container);
    await expectNoAxeViolations(document.querySelector('[data-component="Popover"]') as HTMLElement);
  });
});

describe("Select: typeahead and focus", () => {
  it("typing a letter moves the active option to the next one that starts with it, skipping disabled ones", async () => {
    render(<Fruit />);
    await userEvent.click(box());
    await userEvent.keyboard("g");
    expect(box()).toHaveAttribute("aria-activedescendant", option("Grape").id);
    await userEvent.keyboard("c");
    expect(box()).toHaveAttribute("aria-activedescendant", option("Grape").id);
    expect(box()).toHaveFocus();
  });

  it("a longer word refines, and Space inside a word does not choose", async () => {
    const onValueChange = vi.fn();
    render(
      <Select label="Fruit" onValueChange={onValueChange}>
        <Select.Option value="1">Blue berry</Select.Option>
        <Select.Option value="2">Blueberry pie</Select.Option>
        <Select.Option value="3">Banana</Select.Option>
      </Select>,
    );
    await userEvent.click(box());
    await userEvent.keyboard("blue ");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(box()).toHaveAttribute("aria-activedescendant", option("Blue berry").id);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("Space chooses when no word is being typed", async () => {
    const onValueChange = vi.fn();
    render(<Fruit onValueChange={onValueChange} />);
    await userEvent.click(box());
    await userEvent.keyboard("{ArrowDown} ");
    expect(onValueChange).toHaveBeenCalledWith("banana");
  });

  it("matches the label, not the description", async () => {
    render(
      <Select label="Fruit">
        <Select.Option value="1" description="zebra">
          Apple
        </Select.Option>
        <Select.Option value="2">Zucchini</Select.Option>
      </Select>,
    );
    await userEvent.click(box());
    await userEvent.keyboard("z");
    expect(box()).toHaveAttribute("aria-activedescendant", option("Zucchini").id);
  });

  it("typing on a closed select does not open it", async () => {
    render(<Fruit />);
    box().focus();
    await userEvent.keyboard("g");
    expect(listbox()).toBeNull();
  });

  it("closes when focus leaves for outside the popup, and calls the consumer's onBlur", async () => {
    const onBlur = vi.fn();
    render(
      <>
        <Fruit onBlur={onBlur} />
        <button type="button">outside</button>
      </>,
    );
    await userEvent.click(box());
    expect(listbox()).toBeInTheDocument();
    act(() => screen.getByRole("button", { name: "outside" }).focus());
    expect(listbox()).toBeNull();
    expect(onBlur).toHaveBeenCalled();
  });

  it("choosing an option with the pointer does not count as focus leaving", async () => {
    render(<Fruit />);
    await userEvent.click(box());
    await userEvent.click(option("Banana"));
    expect(box()).toHaveTextContent("Banana");
    expect(box()).toHaveFocus();
  });
});

describe("Select: loading", () => {
  const live = () => document.querySelector('[data-component="LiveRegion"]');

  it("shows a loading row above the list, which is busy, and says so once", async () => {
    render(
      <Select label="Fruit" loading>
        <Select.Option value="a">Apple</Select.Option>
      </Select>,
    );
    await userEvent.click(box());
    expect(screen.getByText("Loading…")).toBeInTheDocument();
    expect(screen.getByRole("listbox")).toHaveAttribute("aria-busy", "true");
    await waitFor(() => expect(live()?.textContent).toBe("Loading"), { timeout: 3000 });
  });

  it("with no options yet the list is hidden and only the loading row shows", async () => {
    render(
      <Select label="Fruit" loading loadingText="Fetching…">
        {null}
      </Select>,
    );
    await userEvent.click(box());
    expect(screen.getByText("Fetching…")).toBeInTheDocument();
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.queryAllByRole("option")).toHaveLength(0);
  });
});

behavesAsFormControl({
  Component: Select,
  dataComponent: "Select",
  props: { native: true, children: <Select.Option value="a">A</Select.Option> },
  control: "select",
});

describe("Select: native", () => {
  const nativeBox = () => screen.getByRole("combobox", { name: "Fruit" }) as HTMLSelectElement;

  it("is a real select in the field, with the options and groups read from the children", () => {
    render(
      <Select label="Fruit" native placeholder="Choose one">
        <Select.Option value="apple">Apple</Select.Option>
        <>
          <Select.Option value="banana" disabled>
            Banana
          </Select.Option>
        </>
        <Select.Section label="Citrus">
          <Select.Option value="lemon">
            <b>Lemon</b> sour
          </Select.Option>
        </Select.Section>
      </Select>,
    );
    expect(nativeBox().tagName).toBe("SELECT");
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Choose one", "Apple", "Banana", "Lemon sour"]);
    expect(screen.getByRole("option", { name: "Choose one" })).toBeDisabled();
    expect(screen.getByRole("option", { name: "Banana" })).toBeDisabled();
    expect(screen.getByRole("group", { name: "Citrus" })).toContainElement(screen.getByRole("option", { name: "Lemon sour" }));
    expect(nativeBox()).toHaveValue("");
    expect(nativeBox()).toHaveAttribute("data-placeholder");
  });

  it("chooses with the system picker and keeps its own value", async () => {
    const onValueChange = vi.fn();
    render(
      <Select label="Fruit" native onValueChange={onValueChange}>
        <Select.Option value="apple">Apple</Select.Option>
        <Select.Option value="grape">Grape</Select.Option>
      </Select>,
    );
    await userEvent.selectOptions(nativeBox(), "grape");
    expect(onValueChange).toHaveBeenCalledWith("grape");
    expect(nativeBox()).toHaveValue("grape");
    expect(nativeBox()).not.toHaveAttribute("data-placeholder");
  });

  it("can be controlled, and starts from defaultValue", async () => {
    const { rerender } = render(
      <Select label="Fruit" native defaultValue="grape">
        <Select.Option value="apple">Apple</Select.Option>
        <Select.Option value="grape">Grape</Select.Option>
      </Select>,
    );
    expect(nativeBox()).toHaveValue("grape");
    rerender(
      <Select label="Fruit" native value="apple" onValueChange={() => {}}>
        <Select.Option value="apple">Apple</Select.Option>
        <Select.Option value="grape">Grape</Select.Option>
      </Select>,
    );
    expect(nativeBox()).toHaveValue("apple");
  });

  it("submits its value under name, as a select does", () => {
    const { container } = render(
      <form>
        <Select label="Fruit" native name="fruit" defaultValue="grape">
          <Select.Option value="apple">Apple</Select.Option>
          <Select.Option value="grape">Grape</Select.Option>
        </Select>
      </form>,
    );
    expect(new FormData(container.querySelector("form") as HTMLFormElement).get("fruit")).toBe("grape");
  });

  it("disabled is disabled, and read-only keeps the picker from opening and the value from changing", () => {
    const { rerender } = render(
      <Select label="Fruit" native disabled>
        <Select.Option value="a">A</Select.Option>
      </Select>,
    );
    expect(nativeBox()).toBeDisabled();
    rerender(
      <Select label="Fruit" native readOnly defaultValue="a">
        <Select.Option value="a">A</Select.Option>
        <Select.Option value="b">B</Select.Option>
      </Select>,
    );
    expect(nativeBox()).toHaveAttribute("aria-readonly", "true");
    expect(fireEvent.keyDown(nativeBox(), { key: "ArrowDown" })).toBe(false);
    expect(fireEvent.keyDown(nativeBox(), { key: "Tab" })).toBe(true);
    expect(fireEvent.mouseDown(nativeBox())).toBe(false);
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <Select label="Fruit" native description="Help" error="Required" placeholder="Choose">
        <Select.Option value="a">A</Select.Option>
      </Select>,
    );
    await expectNoAxeViolations(container);
  });
});
