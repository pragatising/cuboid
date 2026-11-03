import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { behavesAsComponent, expectNoAxeViolations } from "../../../test/testing";
import { cubeVariablesRead, readSource, themeVariables } from "../../../test/themeCss";
import { Image } from "./Image";
import type { ImageProps } from "./Image";
import { downloadImage, imageFileExtension } from "./imageFile";

const SRC = "https://example.com/photos/team.jpg";

behavesAsComponent({ Component: Image, dataComponent: "Image", props: { src: SRC, alt: "The team" } });

// jsdom has no layout: give the figure a width so the handles can turn pixels into a percentage.
let widthOf = 600;
beforeEach(() => {
  widthOf = 600;
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const width = this.tagName === "FIGURE" ? widthOf : 0;
    return { width, height: 0, top: 0, left: 0, right: width, bottom: 0, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
  });
});
afterEach(() => vi.restoreAllMocks());

const image = (props: Partial<ImageProps> = {}) => render(<Image src={SRC} alt="The team" {...props} />);

describe("Image: read", () => {
  it("is the picture, with its alt text", () => {
    image();
    expect(screen.getByRole("img", { name: "The team" })).toHaveAttribute("src", SRC);
  });

  it("draws nothing without an address, and no editing without editable", () => {
    const { container } = render(<Image alt="" />);
    expect(container).toBeEmptyDOMElement();
    image();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("separator")).toBeNull();
    expect(screen.queryByRole("button", { name: "Caption" })).toBeNull();
  });

  it("is as wide as asked, as a percentage of its column, and no narrower than the image token allows", () => {
    const { rerender } = image({ width: 60 });
    const box = () => screen.getByRole("img").parentElement as HTMLElement;
    expect(box().style.width).toBe("60%");
    rerender(<Image src={SRC} alt="The team" width={5} />);
    expect(box().style.width).toBe(`${tokens.light.image.sizes.minWidth}%`);
    rerender(<Image src={SRC} alt="The team" width={400} />);
    expect(box().style.width).toBe("100%");
  });

  it("shows its caption as a figcaption, only when there is one", () => {
    const { rerender } = image({ caption: "The whole team" });
    expect(screen.getByText("The whole team").closest("figcaption")).not.toBeNull();
    rerender(<Image src={SRC} alt="" />);
    expect(document.querySelector("figcaption")).toBeNull();
  });

  it("has a border unless it is told not to", () => {
    const { rerender } = image();
    expect(screen.getByRole("img")).toHaveAttribute("data-bordered");
    rerender(<Image src={SRC} alt="The team" bordered={false} />);
    expect(screen.getByRole("img")).not.toHaveAttribute("data-bordered");
  });

  it("offers Expand only when it can expand, and Download always", async () => {
    const onExpand = vi.fn();
    const { rerender } = image();
    expect(screen.queryByRole("button", { name: "Expand" })).toBeNull();
    expect(screen.getByRole("button", { name: "Download" })).toBeInTheDocument();
    rerender(<Image src={SRC} alt="" onExpand={onExpand} />);
    await userEvent.click(screen.getByRole("button", { name: "Expand" }));
    expect(onExpand).toHaveBeenCalledOnce();
  });
});

describe("Image: adding a picture", () => {
  const file = new File(["x"], "team.png", { type: "image/png" });

  it("is an Add Image bar while there is no picture", () => {
    render(<Image editable />);
    expect(screen.getByRole("button", { name: "Add Image" })).toBeInTheDocument();
  });

  it("hands a chosen file to onUpload, and keeps the address it gives back", async () => {
    const onUpload = vi.fn().mockResolvedValue("asset:abc");
    const onChange = vi.fn();
    const { container } = render(<Image editable onUpload={onUpload} onChange={onChange} />);
    fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [file] } });
    await waitFor(() => expect(onChange).toHaveBeenCalledWith({ src: "asset:abc" }));
    expect(onUpload).toHaveBeenCalledWith(file);
  });

  it("takes the file's own data URL when nothing uploads it", async () => {
    const onChange = vi.fn();
    const { container } = render(<Image editable onChange={onChange} />);
    fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [file] } });
    await waitFor(() => expect(onChange).toHaveBeenCalledWith({ src: expect.stringMatching(/^data:image\/png/) }));
  });

  it("takes a file dropped on the bar, and ignores one that is not an image", async () => {
    const onUpload = vi.fn().mockResolvedValue("asset:dropped");
    const onChange = vi.fn();
    render(<Image editable onUpload={onUpload} onChange={onChange} />);
    const bar = screen.getByRole("button", { name: "Add Image" });
    fireEvent.drop(bar, { dataTransfer: { files: [new File(["x"], "notes.txt", { type: "text/plain" })] } });
    expect(onUpload).not.toHaveBeenCalled();
    fireEvent.drop(bar, { dataTransfer: { files: [file] } });
    await waitFor(() => expect(onChange).toHaveBeenCalledWith({ src: "asset:dropped" }));
  });

  it("says it is uploading, and says why it failed and that it can be tried again", async () => {
    let fail!: (error: Error) => void;
    const onUpload = vi.fn(() => new Promise<string>((_, reject) => (fail = reject)));
    const { container } = render(<Image editable onUpload={onUpload} />);
    fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [file] } });
    expect(await screen.findByText("Uploading…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Uploading/ })).toBeDisabled();
    await act(async () => fail(new Error("Too large")));
    expect(await screen.findByRole("alert")).toHaveTextContent("Too large, click to try again");
    expect(screen.getByRole("button", { name: /Add Image/ })).toBeEnabled();
  });
});

describe("Image: editing a picture", () => {
  it("has a handle on each side that reports a width, the picture staying centred", async () => {
    const onChange = vi.fn();
    image({ editable: true, width: 50, onChange });
    const left = screen.getByRole("separator", { name: "Resize image from the left" });
    const right = screen.getByRole("separator", { name: "Resize image from the right" });
    // 50% of a 600px column is 300px; each handle is given half of that.
    expect(right).toHaveAttribute("aria-valuenow", "150");
    right.focus();
    await userEvent.keyboard("{ArrowRight}");
    // One step (8px) is half of the width's change: 300 + 16 = 316px, 53% of 600 rounded.
    expect(onChange).toHaveBeenLastCalledWith({ width: 53 });
    left.focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(onChange).toHaveBeenLastCalledWith({ width: 53 });
  });

  it("is never made narrower than the token's minimum, nor wider than the column", async () => {
    const onChange = vi.fn();
    image({ editable: true, width: 100, onChange });
    const right = screen.getByRole("separator", { name: "Resize image from the right" });
    expect(right).toHaveAttribute("aria-valuemax", "300");
    expect(right).toHaveAttribute("aria-valuemin", String((600 * tokens.light.image.sizes.minWidth) / 200));
  });

  it("has a Border toggle in the toolbar that shows whether the picture has one, and flips it", async () => {
    const onChange = vi.fn();
    const { rerender } = image({ editable: true, bordered: true, onChange });
    const toggle = screen.getByRole("button", { name: "Border" });
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(toggle);
    expect(onChange).toHaveBeenLastCalledWith({ bordered: false });
    rerender(<Image editable src={SRC} alt="The team" bordered={false} onChange={onChange} />);
    expect(screen.getByRole("button", { name: "Border" })).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(screen.getByRole("button", { name: "Border" }));
    expect(onChange).toHaveBeenLastCalledWith({ bordered: true });
  });

  it("has no Border toggle when it is only read", () => {
    image();
    expect(screen.queryByRole("button", { name: "Border" })).toBeNull();
  });

  it("opens a caption field with the toolbar's Caption, and reports what is typed", async () => {
    const onChange = vi.fn();
    image({ editable: true, onChange });
    expect(screen.queryByRole("textbox", { name: "Image caption" })).toBeNull();
    const toggle = screen.getByRole("button", { name: "Caption" });
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    await userEvent.type(screen.getByRole("textbox", { name: "Image caption" }), "A");
    expect(onChange).toHaveBeenLastCalledWith({ caption: "A" });
  });

  it("starts with the caption field open when there is a caption", () => {
    image({ editable: true, caption: "Hello" });
    expect(screen.getByRole("textbox", { name: "Image caption" })).toHaveValue("Hello");
  });

  it("shows the toolbar and handles over the picture when it is hovered, and hides them otherwise", async () => {
    image({ editable: true });
    const toolbar = document.querySelector('[data-component="Image.Toolbar"]') as HTMLElement;
    expect(toolbar.style.opacity).toBe("0");
    await userEvent.hover(screen.getByRole("img"));
    expect(toolbar.style.opacity).toBe("1");
    await userEvent.unhover(screen.getByRole("img"));
    expect(toolbar.style.opacity).toBe("0");
  });

  it("shows them for keyboard users too, while focus is inside the picture", async () => {
    image({ editable: true });
    const toolbar = document.querySelector('[data-component="Image.Toolbar"]') as HTMLElement;
    act(() => screen.getByRole("button", { name: "Download" }).focus());
    expect(toolbar.style.opacity).toBe("1");
  });
});

describe("Image: a picture that does not load", () => {
  it("is a bar that says so, named by the alt text, not the browser's broken icon", () => {
    image({ alt: "The team" });
    fireEvent.error(screen.getByRole("img", { name: "The team" }));
    expect(document.querySelector("img")).toBeNull();
    expect(screen.getByRole("img", { name: "The team" })).toHaveTextContent("Image could not be loaded");
  });

  it("tries again when the address changes", () => {
    const { rerender } = image({ alt: "The team" });
    fireEvent.error(screen.getByRole("img", { name: "The team" }));
    rerender(<Image src="https://example.com/other.jpg" alt="The team" />);
    expect(document.querySelector("img")).toHaveAttribute("src", "https://example.com/other.jpg");
  });

  it("keeps its toolbar and handles, so it can still be replaced, resized or saved", () => {
    image({ editable: true });
    fireEvent.error(document.querySelector("img")!);
    expect(screen.getByRole("button", { name: "Download" })).toBeInTheDocument();
    expect(screen.getAllByRole("separator")).toHaveLength(2);
  });
});

describe("Image: files", () => {
  it.each([
    ["https://example.com/a/photo.JPG?x=1", "jpg"],
    ["https://example.com/a/photo.webp", "webp"],
    ["data:image/jpeg;base64,AAAA", "jpg"],
    ["data:image/svg+xml;utf8,<svg/>", "svg"],
    ["asset:abc", "png"],
  ])("names the extension of %s", (src, extension) => expect(imageFileExtension(src)).toBe(extension));

  it("saves a data URL through a link, without fetching", async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    await downloadImage("data:image/png;base64,AAAA", "x.png");
    expect(click).toHaveBeenCalledOnce();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("opens the picture when it cannot be fetched, so it can still be saved by hand", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("CORS"));
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    await downloadImage(SRC, "x.jpg");
    expect(open).toHaveBeenCalledWith(SRC, "_blank", "noopener,noreferrer");
  });
});

describe("Image: accessibility and tokens", () => {
  it("has no axe violations, read or editable, empty or placed", async () => {
    const read = image({ caption: "Caption" });
    await expectNoAxeViolations(read.container);
    read.unmount();
    const editing = image({ editable: true, caption: "Caption" });
    await expectNoAxeViolations(editing.container);
    editing.unmount();
    const empty = render(<Image editable />);
    await expectNoAxeViolations(empty.container);
  });

  it("reads only --cube-* variables that exist in the built theme.css, in both modes", () => {
    const read = cubeVariablesRead(readSource("src/components/core/Image/Image.module.css"));
    expect(read.length).toBeGreaterThan(0);
    for (const variable of read) {
      expect(themeVariables().light.has(variable), `${variable} (light)`).toBe(true);
      expect(themeVariables().dark.has(variable), `${variable} (dark)`).toBe(true);
    }
  });
});
