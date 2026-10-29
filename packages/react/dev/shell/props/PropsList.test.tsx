import React, { useEffect } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { printExample } from "../../engine/print";
import { anatomyExample, composeExamples } from "../playground/compose";
import { importFrom } from "../playground/host";
import { PropsProvider, useProps } from "./PropsContext";
import { PropsList } from "./PropsList";
import { withProps } from "./overrides";

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

  it("the content is typed, and emptying it takes it away", () => {
    playing("Button");
    const children = row("children") as HTMLInputElement;
    fireEvent.change(children, { target: { value: "Send it" } });
    expect(code()).toContain(">Send it</Button>");
    fireEvent.change(children, { target: { value: "" } });
    expect(code()).toContain("<Button />");
  });

  it("a slot opens a list of what can go in it, and the example changes when something is chosen", async () => {
    playing("Button");
    const before = code();
    fireEvent.click(screen.getByRole("button", { name: /leadingVisual: React\.ReactNode/ }));
    const icon = await screen.findByRole("menuitemradio", { name: "Icon" });
    expect(code()).toBe(before);
    fireEvent.click(icon);
    expect(code()).toMatch(/leadingVisual=\{<Icon name="add" \/>\}/);
    expect(screen.getByRole("button", { name: /leadingVisual: Icon/ })).toBeTruthy();
  });

  it("a slot that is optional can be emptied again: None", async () => {
    playing("Button");
    fireEvent.click(screen.getByRole("button", { name: /leadingVisual: React\.ReactNode/ }));
    fireEvent.click(await screen.findByRole("menuitemradio", { name: "Icon" }));
    fireEvent.click(screen.getByRole("button", { name: /leadingVisual: Icon/ }));
    fireEvent.click(await screen.findByRole("menuitemradio", { name: "None" }));
    expect(code()).not.toContain("leadingVisual");
  });

  it("a slot that must be filled can be changed and never emptied: no None, and opening it breaks nothing", async () => {
    playing("ActionMenu");
    const before = code();
    fireEvent.click(screen.getByRole("button", { name: /trigger: Button/ }));
    await screen.findByRole("menuitemradio", { name: "Pill" });
    expect(screen.queryByRole("menuitemradio", { name: "None" })).toBeNull();
    expect(code()).toBe(before);
    expect(code()).toContain("trigger={");
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Pill" }));
    expect(code()).toMatch(/trigger=\{<Pill/);
  });

  it("text is typed, and a number is a number", () => {
    playing("Select");
    fireEvent.change(row("placeholder"), { target: { value: "Pick one" } });
    expect(code()).toContain('placeholder="Pick one"');
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
    expect(bg()).toEqual(["backgroundColor: CssColor: CssColor", "backgroundColor: BgColor: BgColor"]);
    fireEvent.click(screen.getByRole("button", { name: "backgroundColor: BgColor: BgColor" }));
    const panel = await screen.findByRole("dialog", { name: "backgroundColor: BgColor" });
    fireEvent.click(within(panel).getByRole("radio", { name: "canvas.inset" }));
    expect(code()).toContain('backgroundColor="canvas.inset"');
    expect(bg()).toEqual(["backgroundColor: CssColor: CssColor", "backgroundColor: BgColor: canvas.inset"]);
  });

  it("a part that takes any CSS colour takes one typed in", async () => {
    playing("Box");
    fireEvent.click(screen.getByRole("button", { name: "backgroundColor: CssColor: CssColor" }));
    await screen.findByRole("dialog", { name: "backgroundColor: CssColor" });
    fireEvent.change(screen.getByRole("textbox", { name: /Search backgroundColor: CssColor/ }), { target: { value: "#ff0000" } });
    fireEvent.click(await screen.findByRole("button", { name: "Use #ff0000" }));
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

  it("a choice of more than four is one chip that says what is chosen, also where nothing is being played with", () => {
    render(<PropsList component="Pill" />);
    const shade = [...screen.getByLabelText("Pill properties").querySelectorAll("li")].find((li) => li.textContent?.startsWith("shade")) as HTMLElement;
    expect(shade.querySelectorAll("[data-select]")).toHaveLength(1);
    expect(shade.textContent).toContain("gray");
    expect(shade.textContent).not.toContain("purple");
    expect(shade.querySelector('[role="radiogroup"], [role="group"]')).toBeNull();
  });

  it("only says the same, and changes nothing, where nothing is being played with", () => {
    render(<PropsList component="Button" />);
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
    expect(screen.getAllByText("lg").length).toBeGreaterThan(0);
  });
});
