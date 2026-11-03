import { render } from "@testing-library/react";
import { Image } from "@sragatiping/cuboid";
import { firstTextNode } from "./layout";

describe("the first line of a block", () => {
  it("is the first text it shows", () => {
    const { container } = render(
      <div>
        <p>
          <strong>Hello</strong> world
        </p>
      </div>,
    );
    expect(firstTextNode(container)?.textContent).toBe("Hello");
  });

  it("passes over decorative parts: an icon's ligature is a word to the browser, not a line of the block", () => {
    const { container } = render(
      <div>
        <span aria-hidden="true">notes</span>
        <p>The text</p>
      </div>,
    );
    expect(firstTextNode(container)?.textContent).toBe("The text");
  });

  it("passes over what a block marks to be skipped", () => {
    const { container } = render(
      <div>
        <span data-editor-gutter-skip="">Click to load</span>
        <p>Caption</p>
      </div>,
    );
    expect(firstTextNode(container)?.textContent).toBe("Caption");
  });

  it("finds no line in a picture, whose only words are its toolbar's icons, so its gutter sits at the top", () => {
    const { container } = render(<Image editable src="https://example.com/a.png" alt="A chart" />);
    expect(container.textContent).toMatch(/notes|download/);
    expect(firstTextNode(container)).toBeNull();
  });
});
