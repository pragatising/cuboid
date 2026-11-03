import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { DocNode } from "../core";
import { Editor } from "./Editor";

const page: DocNode = {
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Policy" }] },
    { type: "paragraph", content: [{ type: "text", text: "Body text" }] },
  ],
};

describe("Editor", () => {
  it("is a named, editable page that starts from the document it is given", async () => {
    render(<Editor defaultValue={page} />);
    const region = await screen.findByRole("textbox", { name: "Document" });
    expect(region).toHaveAttribute("contenteditable", "true");
    expect(region).toHaveTextContent("PolicyBody text");
  });

  it("takes another name for the page", async () => {
    render(<Editor defaultValue={page} aria-label="Project brief" />);
    expect(await screen.findByRole("textbox", { name: "Project brief" })).toBeInTheDocument();
  });

  it("starts as an empty page without a document", async () => {
    render(<Editor />);
    expect(await screen.findByRole("textbox", { name: "Document" })).toBeInTheDocument();
  });

  it("reports the document as it changes", async () => {
    const onChange = vi.fn();
    render(<Editor defaultValue={page} onChange={onChange} />);
    const region = await screen.findByRole("textbox", { name: "Document" });
    // jsdom has no pointer geometry, so the text is changed in the DOM, which the editor reads as typing does.
    const text = region.querySelector("p")!.firstChild as Text;
    text.textContent = "Body text!";
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(JSON.stringify(onChange.mock.lastCall![0])).toContain("Body text!");
  });

  it("is view only with readOnly: the page as a reader gets it, nothing to type in", () => {
    const { container } = render(<Editor readOnly defaultValue={page} />);
    expect(screen.getByRole("heading", { name: "Policy" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(container.querySelector(".ProseMirror")).toBeNull();
    expect(container.querySelector('[data-component="Read"]')).not.toBeNull();
  });

  it("names itself for the shell and passes other attributes to its root", () => {
    const { container } = render(<Editor readOnly data-testid="page" />);
    expect(container.querySelector('[data-component="Editor"]')).toHaveAttribute("data-testid", "page");
  });

  it("is at least 720px tall, so the empty page below the writing is a place to click", () => {
    const { container } = render(<Editor readOnly />);
    expect(container.querySelector<HTMLElement>('[data-component="Editor"]')!.style.minHeight).toBe("720px");
  });
});

describe("Editor: width", () => {
  const column = (container: HTMLElement) => container.querySelector<HTMLElement>('[data-component="Editor"] > div')!;

  it("is narrow unless told otherwise: 584px", () => {
    const { container } = render(<Editor readOnly />);
    expect(container.querySelector('[data-component="Editor"]')).toHaveAttribute("data-width", "narrow");
    expect(column(container).style.width).toBe("584px");
  });

  it("is 792px wide, or 90vw full, and does not shrink with its container", () => {
    const wide = render(<Editor readOnly width="wide" />);
    expect(column(wide.container).style.width).toBe("792px");
    wide.unmount();
    const full = render(<Editor readOnly width="full" />);
    expect(column(full.container).style.width).toBe("90vw");
    expect(column(full.container).style.flexShrink).toBe("0");
  });
});

describe("Editor: title", () => {
  it("is a field of its own, above the document and not one of its headings, that starts from defaultTitle", async () => {
    render(<Editor defaultTitle="Policy Optimization" defaultValue={page} />);
    expect(await screen.findByRole("textbox", { name: "Title" })).toHaveTextContent("Policy Optimization");
    // The page has a heading of its own in it, and the title is not counted among the document's.
    expect(screen.getAllByRole("heading", { name: "Policy" })).toHaveLength(1);
  });

  it("says Untitled while it is empty, and not once it has a name", async () => {
    const { rerender } = render(<Editor />);
    expect(await screen.findByText("Untitled")).toBeInTheDocument();
    rerender(<Editor title="Named" />);
    expect(screen.queryByText("Untitled")).toBeNull();
  });

  it("reports what is typed in it", async () => {
    const onTitleChange = vi.fn();
    render(<Editor onTitleChange={onTitleChange} />);
    const field = await screen.findByRole("textbox", { name: "Title" });
    field.textContent = "Brief";
    fireEvent.input(field);
    expect(onTitleChange).toHaveBeenCalledWith("Brief");
  });

  it("is controlled by title when it is given", async () => {
    const { rerender } = render(<Editor title="One" />);
    expect(await screen.findByRole("textbox", { name: "Title" })).toHaveTextContent("One");
    rerender(<Editor title="Two" />);
    expect(screen.getByRole("textbox", { name: "Title" })).toHaveTextContent("Two");
  });

  it("goes to the first block of the page on Enter or ArrowDown, and takes no new line", async () => {
    render(<Editor defaultTitle="T" defaultValue={page} />);
    const field = await screen.findByRole("textbox", { name: "Title" });
    const region = screen.getByRole("textbox", { name: "Document" });
    for (const key of ["Enter", "ArrowDown"]) {
      field.focus();
      const taken = fireEvent.keyDown(field, { key });
      expect(taken).toBe(false);
      await waitFor(() => expect(document.activeElement).toBe(region));
    }
  });

  it("is the page's h1 when only read, and is not there when there is no title", () => {
    const { rerender } = render(<Editor readOnly title="Policy Optimization" />);
    expect(screen.getByRole("heading", { level: 1, name: "Policy Optimization" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).toBeNull();
    rerender(<Editor readOnly />);
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
  });
});

describe("Editor: getting out of the last block", () => {
  it("a press below the last block, which is not text, adds a paragraph there and goes to it", async () => {
    const onChange = vi.fn();
    const { container } = render(<Editor defaultValue={{ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "a" }] }, { type: "divider" }] }} onChange={onChange} />);
    await screen.findByRole("textbox", { name: "Document" });
    const below = container.querySelector('[data-component="Editor.Surface"]')!.parentElement!;
    fireEvent.mouseDown(below);
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(onChange.mock.lastCall![0].content.map((node: DocNode) => node.type)).toEqual(["paragraph", "divider", "paragraph"]);
  });
});
