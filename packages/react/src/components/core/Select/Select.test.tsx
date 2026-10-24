import { useState } from "react";
import { render, screen } from "@testing-library/react";
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
