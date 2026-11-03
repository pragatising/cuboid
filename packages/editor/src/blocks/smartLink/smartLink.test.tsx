import { act } from "react";
import { createRoot } from "react-dom/client";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Editor } from "@tiptap/core";
import { EditorContent } from "@tiptap/react";
import { SmartCard, type SmartLinkClient } from "@sragatiping/cuboid";
import type { DocNode } from "../../core";
import { Read } from "../../read/Read";
import { BLOCK_TYPES } from "../../write/blockTypes";
import { extensionsFor } from "../../write/extensions";

let editor: Editor;
afterEach(() => {
  editor?.destroy();
  document.body.innerHTML = "";
});

const link = (attrs: Partial<{ url: string; appearance: string; height: string }> = {}): DocNode => ({ type: "smartLink", attrs: { url: "", appearance: "embed", height: "", ...attrs } });
const client: SmartLinkClient = { resolve: async (url) => ({ url, title: "Design brief", embedUrl: url }) };

async function mount(...blocks: DocNode[]) {
  const host = document.createElement("div");
  document.body.append(host);
  editor = new Editor({ extensions: extensionsFor(), content: { type: "doc", content: blocks } });
  await act(async () =>
    createRoot(host).render(
      <SmartCard.Provider client={client}>
        <EditorContent editor={editor} />
      </SmartCard.Provider>,
    ),
  );
}

describe("link block", () => {
  it("is offered in the media group of the menus", () => {
    expect(BLOCK_TYPES.find((type) => type.label === "Link")).toMatchObject({ group: "media" });
  });

  it("asks for the address while it is empty, and keeps it once it is one a link can show", async () => {
    await mount(link());
    const user = userEvent.setup();
    await user.type(screen.getByRole("textbox", { name: "Link address" }), "example.com/brief");
    await user.click(screen.getByRole("button", { name: "Add link" }));
    expect(editor.getJSON().content![0].attrs).toEqual({ url: "https://example.com/brief", appearance: "embed", height: "" });
    expect(await screen.findByTitle("Design brief")).toHaveAttribute("src", "https://example.com/brief");
  });

  it("says when the address is not one, and keeps nothing", async () => {
    await mount(link());
    const user = userEvent.setup();
    await user.type(screen.getByRole("textbox", { name: "Link address" }), "javascript:alert(1){Enter}");
    expect(screen.getByText(/starting with http/)).toBeInTheDocument();
    expect(editor.getJSON().content![0].attrs!.url).toBe("");
  });

  it.each(["inline", "block"])("draws a %s link as the SmartCard does", async (appearance) => {
    await mount(link({ url: "https://example.com/brief", appearance }));
    expect(await screen.findByRole("link", { name: /Design brief/ })).toHaveAttribute("href", "https://example.com/brief");
  });

  it("draws an embed as a frame of the address, at the height it names", async () => {
    await mount(link({ url: "https://example.com/brief", height: "16:9" }));
    const frame = await screen.findByTitle("Design brief");
    expect(frame.style.aspectRatio).toBe("16 / 9");
  });

  it("is read as the same card, without the editor", async () => {
    const doc: DocNode = { type: "doc", content: [link({ url: "https://example.com/brief", appearance: "inline" })] };
    await act(async () => {
      createRoot(document.body.appendChild(document.createElement("div"))).render(
        <SmartCard.Provider client={client}>
          <Read node={doc} />
        </SmartCard.Provider>,
      );
    });
    expect(await screen.findByRole("link", { name: /Design brief/ })).toHaveAttribute("href", "https://example.com/brief");
  });

  it("reads an empty one as nothing, and a hostile address as text rather than a link", async () => {
    const doc: DocNode = { type: "doc", content: [link(), link({ url: "javascript:alert(1)", appearance: "inline" })] };
    await act(async () => {
      createRoot(document.body.appendChild(document.createElement("div"))).render(<Read node={doc} />);
    });
    expect(screen.queryByRole("link")).toBeNull();
  });
});

describe("pasting a link", () => {
  const paste = (text: string) =>
    act(async () => {
      const event = new Event("paste", { bubbles: true, cancelable: true }) as Event & { clipboardData: unknown };
      event.clipboardData = { getData: (type: string) => (type === "text/plain" ? text : "") };
      editor.view.dom.dispatchEvent(event);
    });
  const empty: DocNode = { type: "paragraph" };

  it("turns a URL pasted into an empty line into a link block, in place of the line", async () => {
    await mount(empty);
    await act(async () => void editor.commands.setTextSelection(1));
    await paste("https://example.com/brief");
    expect(editor.getJSON().content).toEqual([{ type: "smartLink", attrs: { url: "https://example.com/brief", appearance: "embed", height: "" } }]);
  });

  it("takes the src of pasted iframe code", async () => {
    await mount(empty);
    await act(async () => void editor.commands.setTextSelection(1));
    await paste('<iframe src="https://example.com/embed/1"></iframe>');
    expect(editor.getJSON().content?.[0].attrs?.url).toBe("https://example.com/embed/1");
  });

  it("leaves a URL pasted into a sentence to the engine", async () => {
    await mount({ type: "paragraph", content: [{ type: "text", text: "see " }] });
    await act(async () => void editor.commands.setTextSelection(5));
    await paste("https://example.com/brief");
    expect(editor.getJSON().content?.[0].type).toBe("paragraph");
  });
});

describe("link toolbar", () => {
  it("shows while the block is selected and changes how it looks", async () => {
    await mount(link({ url: "https://example.com/a" }), { type: "paragraph" });
    await act(async () => void editor.commands.setTextSelection(editor.state.doc.content.size - 1));
    expect(screen.queryByRole("toolbar", { name: "Link" })).toBeNull();
    await act(async () => void editor.commands.setNodeSelection(0));
    const toolbar = screen.getByRole("toolbar", { name: "Link" });
    await userEvent.click(within(toolbar).getByRole("button", { name: "Inline" }));
    expect(editor.getJSON().content?.[0].attrs?.appearance).toBe("inline");
    expect(within(toolbar).getByRole("link", { name: /open link/i })).toHaveAttribute("href", "https://example.com/a");
  });
});

