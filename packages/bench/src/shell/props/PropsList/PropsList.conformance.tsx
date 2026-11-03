import React, { useEffect } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { printExample } from "../../../engine/print";
import { anatomyExample, composeExamples } from "../../playground/compose";
import { importFrom } from "../../playground/host";
import { PropsProvider, useProps } from "../PropsContext";
import { SourceProvider } from "../../source";
import { PropsList } from "./PropsList";
import { withProps } from "../overrides";

afterEach(cleanup);

/** The Playground in little: it tells the pane which example it has, and shows the code the example has with what the pane changed. */
function Harness({ component }: { component: string }) {
  const play = useProps();
  const tour = composeExamples(component);
  const example = anatomyExample(tour);
  useEffect(() => {
    if (example && tour) play?.setBase({ component, doc: tour.doc, node: example.node });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [component]);
  const node = example ? withProps(example.node, component, play?.overrides ?? {}) : null;
  return (
    <>
      <PropsList component={component} />
      <pre data-testid="code">{node ? printExample(node, { importFrom }).code : ""}</pre>
    </>
  );
}

const playing = (component: string) =>
  render(
    <PropsProvider>
      <Harness component={component} />
    </PropsProvider>,
  );
const code = () => screen.getByTestId("code").textContent ?? "";
const row = (name: string) => screen.getByLabelText(name, { selector: "[role=radiogroup], input, button, [role=switch]" });

describe("the properties, played with", () => {
  it("choosing the default again takes it off the code, so the code stays as short as it can be", () => {
    playing("Button");
    fireEvent.click(within(row("size")).getByRole("radio", { name: /^lg/ }));
    expect(code()).toContain('size="lg"');
    fireEvent.click(within(row("size")).getByRole("radio", { name: /md/ }));
    expect(code()).not.toContain("size=");
  });

  it("shows the default as chosen to begin with", () => {
    playing("Button");
    expect(within(row("size")).getByRole("radio", { name: /md/ }).getAttribute("aria-checked")).toBe("true");
  });

  it("a switch turns a flag on and off", () => {
    playing("Button");
    fireEvent.click(row("disabled"));
    expect(code()).toContain("disabled");
    fireEvent.click(row("disabled"));
    expect(code()).not.toContain("disabled");
  });

  it("the content is typed, and used when the field is left; emptying it takes it away", async () => {
    playing("Button");
    const children = screen.getByRole("combobox", { name: "children" });
    await userEvent.clear(children);
    await userEvent.type(children, "Send it");
    await userEvent.tab();
    expect(code()).toContain(">Send it</Button>");
    await userEvent.clear(children);
    await userEvent.tab();
    expect(code()).toContain("<Button />");
  });

  it("a slot is an autocomplete of what can go in it, and the example changes when something is chosen", async () => {
    playing("Button");
    const before = code();
    const field = screen.getByRole("combobox", { name: "leadingVisual" });
    await userEvent.click(field);
    const icon = await screen.findByRole("option", { name: "Icon" });
    expect(code()).toBe(before);
    await userEvent.click(icon);
    expect(code()).toMatch(/leadingVisual=\{<Icon name="add" \/>\}/);
    expect(field).toHaveValue("Icon");
  });

  it("typing narrows what can go in a slot", async () => {
    playing("Button");
    const field = screen.getByRole("combobox", { name: "leadingVisual" });
    await userEvent.click(field);
    await userEvent.type(field, "Ico");
    expect(await screen.findByRole("option", { name: "Icon" })).toBeTruthy();
    expect(screen.queryByRole("option", { name: "Pill" })).toBeNull();
  });

  it("a slot that is optional can be emptied again: None", async () => {
    playing("Button");
    const field = screen.getByRole("combobox", { name: "leadingVisual" });
    await userEvent.click(field);
    await userEvent.click(await screen.findByRole("option", { name: "Icon" }));
    await userEvent.click(field);
    await userEvent.click(await screen.findByRole("option", { name: "None" }));
    expect(code()).not.toContain("leadingVisual");
  });

  it("a slot that must be filled can be changed and never emptied: no None, and opening it breaks nothing", async () => {
    playing("ActionMenu");
    const before = code();
    const field = screen.getByRole("combobox", { name: "trigger" });
    expect(field).toHaveValue("Button");
    await userEvent.click(field);
    await screen.findByRole("option", { name: "Pill" });
    expect(screen.queryByRole("option", { name: "None" })).toBeNull();
    expect(code()).toBe(before);
    expect(code()).toContain("trigger={");
    await userEvent.click(screen.getByRole("option", { name: "Pill" }));
    expect(code()).toMatch(/trigger=\{<Pill/);
  });

  it("text is typed, and a number is a number", () => {
    playing("Select");
    fireEvent.change(row("placeholder"), { target: { value: "Pick one" } });
    expect(code()).toContain('placeholder="Pick one"');
  });

  it("text is typed even when it is state the component can hold itself: title, defaultTitle", () => {
    playing("Editor");
    fireEvent.change(row("title"), { target: { value: "A new title" } });
    expect(code()).toContain('title="A new title"');
    fireEvent.change(row("defaultTitle"), { target: { value: "Another" } });
    expect(code()).toContain('defaultTitle="Another"');
  });

  it("writes a function out, and does not make it a control", () => {
    playing("Select");
    const text = screen.getByLabelText("Select properties").textContent ?? "";
    expect(text).toContain("(value: string) => void");
  });

  it("marks what is optional with ?: and what is required with :", () => {
    playing("EmptyState");
    const rows = [...screen.getByLabelText("EmptyState properties").querySelectorAll("li")].map((li) => li.textContent ?? "");
    expect(rows.find((r) => r.startsWith("layout"))).toContain("?:");
    expect(rows.find((r) => r.startsWith("description"))).not.toContain("?:");
  });

  it("a choice of colours opens swatches: the colour as it looks, chosen from a popover, and the code follows", async () => {
    playing("Highlight");
    const before = code();
    fireEvent.click(screen.getByRole("button", { name: /^color: yellow/ }));
    const panel = await screen.findByRole("dialog", { name: "color" });
    expect(code()).toBe(before);
    const green = within(panel).getByRole("radio", { name: "green" });
    expect(green.style.getPropertyValue("--swatch")).toMatch(/^#[0-9a-f]{6}$/i);
    fireEvent.click(green);
    expect(code()).toContain('color="green"');
    expect(screen.getByRole("button", { name: /^color: green/ })).toBeTruthy();
  });

  it("a type of two parts is a chip for each, and the one that holds the value shows it", async () => {
    playing("Box");
    const bg = () => screen.getAllByRole("button", { name: /^backgroundColor: / }).map((b) => b.getAttribute("aria-label"));
    // In the order the code writes them: `backgroundColor?: BgColor | CssColor`.
    expect(bg()).toEqual(["backgroundColor: BgColor: BgColor", "backgroundColor: CssColor: CssColor"]);
    fireEvent.click(screen.getByRole("button", { name: "backgroundColor: BgColor: BgColor" }));
    const panel = await screen.findByRole("dialog", { name: "backgroundColor: BgColor" });
    fireEvent.click(within(panel).getByRole("radio", { name: "canvas.inset" }));
    expect(code()).toContain('backgroundColor="canvas.inset"');
    expect(bg()).toEqual(["backgroundColor: BgColor: canvas.inset", "backgroundColor: CssColor: CssColor"]);
  });

  it("a part that takes any CSS colour takes one typed in", async () => {
    playing("Box");
    fireEvent.click(screen.getByRole("button", { name: "backgroundColor: CssColor: CssColor" }));
    await screen.findByRole("dialog", { name: "backgroundColor: CssColor" });
    fireEvent.click(screen.getByRole("button", { name: "Custom" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Hex" }), { target: { value: "#ff0000" } });
    expect(code()).toContain('backgroundColor="#ff0000"');
    expect(screen.getByRole("button", { name: "backgroundColor: CssColor: #ff0000" })).toBeTruthy();
  });

  it("a set of values that is not colours is a list, searched, and a long one shows the first and says how many more", async () => {
    playing("Icon");
    fireEvent.click(screen.getByRole("button", { name: "name: IconName: add" }));
    const search = await screen.findByRole("combobox", { name: "Search name: IconName" });
    expect(screen.getAllByRole("option").length).toBeLessThanOrEqual(101);
    expect(screen.getByText(/more: type to narrow/)).toBeTruthy();
    fireEvent.change(search, { target: { value: "arrow_forward" } });
    fireEvent.click(await screen.findByRole("option", { name: "arrow_forward" }));
    expect(code()).toContain('name="arrow_forward"');
  });

  it("where nothing is being played with, a prop is its type as written, in the code's colours, and nothing can be changed", () => {
    render(<PropsList component="Pill" />);
    const shade = [...screen.getByLabelText("Pill properties").querySelectorAll("li")].find((li) => li.textContent?.startsWith("shade")) as HTMLElement;
    expect(shade.querySelector("[data-select]")).toBeNull();
    expect(shade.querySelector('[role="radiogroup"], [role="group"], button, input')).toBeNull();
    // As the code writes it: `shade?: PillShade`, the name of the set, in the colour of a name.
    expect(shade.textContent).toContain("PillShade");
    expect(shade.querySelector('[data-kind="name"]')).not.toBeNull();
  });

  it("a union too long to read is its first values and an ellipsis, when the code has no name for it", () => {
    render(<PropsList component="Select" />);
    const rows = [...screen.getByLabelText("Select properties").querySelectorAll("li")];
    expect(rows.every((li) => !(li.textContent ?? "").includes('"gray" | "green" | "purple" | "indigo"'))).toBe(true);
  });

  it("a boolean that cannot be changed is written `boolean`, not a switch that cannot be turned", () => {
    render(<PropsList component="Button" />);
    const disabled = [...screen.getByLabelText("Button properties").querySelectorAll("li")].find((li) => li.textContent?.startsWith("disabled")) as HTMLElement;
    expect(disabled.textContent).toContain("boolean");
    expect(disabled.querySelector('[role="switch"], input')).toBeNull();
  });

  it("says a required prop with a colon and an optional one with ?:, as it is when played with", () => {
    render(<PropsList component="Button" />);
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
    expect(screen.getByLabelText("Button properties").textContent).toContain("?:");
  });
});

describe("the sections of a compound component's properties", () => {
  it("has a section for the component and one for each part that has props, the component's open and the parts closed", () => {
    render(<PropsList component="Table" />);
    const headings = screen.getAllByRole("button", { expanded: false }).map((b) => b.getAttribute("aria-label"));
    expect(screen.getByRole("button", { name: /^Table, \d+ props$/, expanded: true })).toBeInTheDocument();
    expect(headings.some((h) => h?.startsWith("Table.HeadCell"))).toBe(true);
    expect(headings.some((h) => h?.startsWith("Table.Cell"))).toBe(true);
    // A part with no props of its own has nothing to show, so no section.
    expect(headings.some((h) => h?.startsWith("Table.Row"))).toBe(false);
  });

  it("says how many props each section holds, to a screen reader (the heading is drawn as the Figma's, without the number)", () => {
    render(<PropsList component="Table" />);
    const own = screen.getByRole("button", { name: /^Table, \d+ props$/ });
    expect(own.textContent).not.toMatch(/\d/);
  });

  it("opens a part to show its props, as types, and closes it again", async () => {
    render(<PropsList component="Table" />);
    const header = screen.getByRole("button", { name: /^Table\.HeadCell/ });
    const list = screen.getByLabelText("Table.HeadCell properties", { selector: "ul", exact: true }) as HTMLElement;
    expect(list).not.toBeVisible();
    await userEvent.click(header);
    expect(header).toHaveAttribute("aria-expanded", "true");
    expect(list).toBeVisible();
    expect(within(list).getByText("sort")).toBeInTheDocument();
    // `sort` is written `TableSort`: the name, in the colour of a name.
    expect(within(list).getByText("TableSort")).toBeInTheDocument();
    expect(within(list).queryAllByRole("radio")).toHaveLength(0);
    await userEvent.click(header);
    expect(list).not.toBeVisible();
  });

  it("closes the component's own section too, and the header is the control for it", async () => {
    render(<PropsList component="Table" />);
    const own = screen.getByRole("button", { name: /^Table, \d+ props$/ });
    const list = screen.getByLabelText("Table properties", { selector: "ul" });
    expect(list).toBeVisible();
    await userEvent.click(own);
    expect(list).not.toBeVisible();
    expect(own).toHaveAttribute("aria-controls");
  });

  it("is only the component's own list for one that has no parts", () => {
    render(<PropsList component="Pill" />);
    expect(screen.getAllByRole("button", { expanded: true })).toHaveLength(1);
    expect(screen.queryAllByRole("button", { expanded: false })).toHaveLength(0);
  });
});


describe("what a component takes from another is an instance of it", () => {
  const sections = () => [...document.querySelectorAll<HTMLElement>('[data-component="PropsList.Section"]')].map((section) => `${section.dataset.kind}:${section.getAttribute("aria-label")}`);

  it("what the caller sets on ActionMenu is in its box, the Popover's props among them; what ActionMenu sets itself on Popover is a section inside", () => {
    render(<PropsList component="ActionMenu" />);
    expect(sections().slice(0, 3)).toEqual(["component:ActionMenu", "instance:Sets on Popover", "component:ActionMenu.List"]);
    const own = screen.getByRole("list", { name: "ActionMenu properties" });
    const names = [...own.querySelectorAll("li")].map((li) => li.textContent ?? "");
    // The caller's: ActionMenu's own (`closeOnSelect`) and the Popover's it takes (`trigger`, `placement`), one list, no tags.
    for (const name of ["closeOnSelect", "trigger", "placement"]) expect(names.some((text) => text.startsWith(name))).toBe(true);
    expect(own.querySelector("[data-how]")).toBeNull();
    // What ActionMenu sets itself: `name = value`, nothing to choose.
    const sets = screen.getByRole("list", { name: "ActionMenu sets", hidden: true });
    const row = (name: string) => [...sets.querySelectorAll("li")].find((li) => li.textContent?.startsWith(name)) as HTMLElement;
    expect(row("autoFocus").textContent).toContain("false");
    expect(row("autoFocus").querySelector("input, button, [role=switch]")).toBeNull();
    expect(names.some((text) => /^autoFocus(?![A-Za-z])/.test(text))).toBe(false);
  });

  it("opens the file of a component with no page of its own: ButtonBase, in Button's source", () => {
    const opened: string[][] = [];
    render(
      <SourceProvider value={{ request: null, open: (component, file) => opened.push([component, file]), goto: () => {} }}>
        <PropsList component="Button" />
      </SourceProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open ButtonBase source" }));
    expect(opened).toEqual([["Button", "ButtonBase.tsx"]]);
  });
});
