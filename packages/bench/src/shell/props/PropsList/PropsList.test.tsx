import React, { useEffect } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { applyEdits, componentResolver, nodeOf, readExample } from "../../../engine/example";
import type { ExampleTree } from "../../../engine/example";
import { apiOf } from "../../../test/fixtureLibrary";
import { PropsProvider, useProps } from "../PropsContext";
import { PropsList } from "./PropsList";

afterEach(cleanup);

/** An example written against the `plain` fixture library: a menu of three items, each written differently. */
const file = `import { Menu } from "@fixture/plain";

export function Example() {
  return (
    <Menu trigger={<button>Open</button>} dense>
      <Menu.Item>Edit</Menu.Item>
      <Menu.Item selected>Copy</Menu.Item>
      <Menu.Item disabled>Delete</Menu.Item>
    </Menu>
  );
}`;

const api = apiOf("plain");
const tree: ExampleTree = readExample(file, componentResolver({ fileSource: file, packages: ["@fixture/plain"], known: (id) => id in api }));
const main = tree.instances.find((instance) => instance.component === "Menu")!;
const SCOPE = "Menu:Example";

/** The Examples view in little: it points the pane at the example, and prints the example's code with what the pane changed. */
function Harness() {
  const play = useProps();
  useEffect(() => {
    play?.setBase({ component: "Menu", doc: { name: "Menu", props: [], parts: [] }, node: nodeOf(main, "Menu"), tree, scope: SCOPE });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const edits = play?.editsOf(SCOPE) ?? {};
  const byId = Object.fromEntries(Object.entries(edits).map(([key, changes]) => [key === "main" ? main.id : key, changes]));
  return (
    <>
      <PropsList component="Menu" api={api} />
      <pre data-testid="code">{applyEdits(tree, byId)}</pre>
    </>
  );
}
const show = () =>
  render(
    <PropsProvider>
      <Harness />
    </PropsProvider>,
  );
const code = () => screen.getByTestId("code").textContent ?? "";
const opened = (name: RegExp) => {
  fireEvent.click(screen.getByRole("button", { name }));
};

describe("the props of a component that has several instances of a part in its example", () => {
  it("lists the instances of the part under it, each by its own text, and says how many", () => {
    show();
    expect(screen.getByRole("region", { name: "Menu.Item" })).toBeInTheDocument();
    expect(screen.getByText("×3")).toBeInTheDocument();
    // Inside the part's section, which is closed to begin with.
    for (const label of ["Edit", "Copy", "Delete"]) expect(screen.getByRole("region", { name: label, hidden: true })).toBeInTheDocument();
  });

  it("shows each instance's own props as that instance writes them", () => {
    show();
    opened(/^Menu\.Item, /);
    opened(/^Copy, /);
    opened(/^Delete, /);
    const copy = screen.getByRole("region", { name: "Copy" });
    const del = screen.getByRole("region", { name: "Delete" });
    expect(within(copy).getByRole("switch", { name: "selected" })).toBeChecked();
    expect(within(del).getByRole("switch", { name: "selected" })).not.toBeChecked();
  });

  it("shows what an instance writes that the component does not list, as written: the element's own `disabled`", () => {
    show();
    opened(/^Menu\.Item, /);
    opened(/^Delete, /);
    const del = screen.getByRole("region", { name: "Delete" });
    expect(within(del).getByRole("list", { name: "Menu.Item written" }).textContent).toBe("disabled");
    opened(/^Copy, /);
    expect(within(screen.getByRole("region", { name: "Copy" })).queryByRole("list", { name: "Menu.Item written" })).toBeNull();
  });

  it("changes the instance it is changed on and none of the others, in the code", () => {
    show();
    opened(/^Menu\.Item, /);
    opened(/^Edit, /);
    const edit = screen.getByRole("region", { name: "Edit" });
    fireEvent.click(within(edit).getByRole("switch", { name: "selected" }));
    expect(code()).toContain("<Menu.Item selected>Edit</Menu.Item>");
    expect(code()).toContain("<Menu.Item selected>Copy</Menu.Item>");
    expect(code()).toContain("<Menu.Item disabled>Delete</Menu.Item>");
    expect(code().match(/selected/g)).toHaveLength(2);
  });

  it("changes the component itself in its own box, apart from its parts", () => {
    show();
    fireEvent.click(screen.getByRole("switch", { name: "dense" }));
    expect(code()).toContain("<Menu trigger={<button>Open</button>} dense={false}>");
    expect(code().match(/selected/g)).toHaveLength(1);
  });
});
