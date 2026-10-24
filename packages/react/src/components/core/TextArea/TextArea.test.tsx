import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { behavesAsFormControl, expectNoAxeViolations } from "../../../test/testing";
import { cubeVariablesRead, readSource, themeVariables } from "../../../test/themeCss";
import { TextArea } from "./TextArea";

behavesAsFormControl({ Component: TextArea, dataComponent: "TextArea" });

const shell = (container: HTMLElement) => container.querySelector('[data-component="InputField.Shell"]') as HTMLElement;

describe("TextArea: element", () => {
  it("is a multi-line textbox named by its label, three rows by default", () => {
    render(<TextArea label="Notes" />);
    const box = screen.getByRole("textbox", { name: "Notes" });
    expect(box.tagName).toBe("TEXTAREA");
    expect(box).toHaveAttribute("rows", "3");
  });

  it("takes rows, and passes native props and the ref to the textarea", () => {
    const ref = { current: null as HTMLTextAreaElement | null };
    render(<TextArea label="Notes" rows={6} maxLength={200} name="notes" placeholder="Write" ref={ref} />);
    const box = screen.getByLabelText("Notes");
    expect(box).toHaveAttribute("rows", "6");
    expect(box).toHaveAttribute("maxlength", "200");
    expect(box).toHaveAttribute("name", "notes");
    expect(box).toHaveAttribute("placeholder", "Write");
    expect(ref.current).toBe(box);
  });

  it("takes an id, and builds one when there is none", () => {
    const { rerender } = render(<TextArea label="A" id="mine" />);
    expect(screen.getByLabelText("A")).toHaveAttribute("id", "mine");
    rerender(<TextArea label="A" />);
    expect(screen.getByLabelText("A").id).not.toBe("");
  });

  it("merges className onto the textarea and wrapperClassName onto the wrapper", () => {
    const { container } = render(<TextArea label="A" className="on-area" wrapperClassName="on-wrapper" />);
    expect(screen.getByLabelText("A")).toHaveClass("on-area");
    expect(container.querySelector('[data-component="TextArea"]')).toHaveClass("on-wrapper");
  });

  it("types lines", async () => {
    render(<TextArea label="A" />);
    await userEvent.type(screen.getByLabelText("A"), "one{Enter}two");
    expect(screen.getByLabelText("A")).toHaveValue("one\ntwo");
  });
});

describe("TextArea: description, error and states", () => {
  it("describes the textarea with the help text and the error, and marks it invalid", () => {
    render(<TextArea label="A" description="Help" error="Required" />);
    const box = screen.getByLabelText("A");
    expect(box).toHaveAccessibleDescription("Help Required");
    expect(box).toHaveAttribute("aria-invalid", "true");
  });

  it("is not invalid without an error", () => {
    render(<TextArea label="A" />);
    expect(screen.getByLabelText("A")).not.toHaveAttribute("aria-invalid");
  });

  it("keeps a consumer's aria-describedby", () => {
    render(
      <>
        <span id="extra">Extra</span>
        <TextArea label="A" description="Help" aria-describedby="extra" />
      </>,
    );
    expect(screen.getByLabelText("A")).toHaveAccessibleDescription("Help Extra");
  });

  it("disabled and read-only reach the textarea and the shell", () => {
    const { container, rerender } = render(<TextArea label="A" disabled />);
    expect(screen.getByLabelText("A")).toBeDisabled();
    expect(shell(container)).toHaveAttribute("data-disabled");
    rerender(<TextArea label="A" readOnly />);
    expect(screen.getByLabelText("A")).toHaveAttribute("readonly");
    expect(shell(container)).toHaveAttribute("data-readonly");
  });

  it("the shell is multiline, sized md by default, and size is an attribute", () => {
    const { container, rerender } = render(<TextArea label="A" />);
    expect(shell(container)).toHaveAttribute("data-multiline");
    expect(shell(container)).toHaveAttribute("data-size", "md");
    rerender(<TextArea label="A" size="lg" />);
    expect(shell(container)).toHaveAttribute("data-size", "lg");
  });

  it("renders the visuals hidden from assistive technology", () => {
    render(<TextArea label="A" leadingVisual={<svg data-testid="lead" />} trailingVisual={<svg data-testid="trail" />} />);
    expect(screen.getByTestId("lead").parentElement).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByTestId("trail").parentElement).toHaveAttribute("aria-hidden", "true");
  });

  it("sets no inline style: the look is in the CSS", () => {
    const { container } = render(<TextArea label="A" />);
    expect(shell(container).getAttribute("style")).toBeNull();
    expect(screen.getByLabelText("A").getAttribute("style")).toBeNull();
  });
});

describe("TextArea CSS reads the published token variables", () => {
  it("reads only --cube-* variables that exist in the built theme.css, in both modes", () => {
    const read = cubeVariablesRead(readSource("src/components/core/TextArea/TextArea.module.css"));
    expect(read.length).toBeGreaterThan(0);
    for (const variable of read) {
      expect(themeVariables().light.has(variable), `${variable} (light)`).toBe(true);
      expect(themeVariables().dark.has(variable), `${variable} (dark)`).toBe(true);
    }
  });

  it("the shared multiline rule is in the field CSS and reads published variables", () => {
    const css = readSource("src/components/core/InputField/InputField.module.css");
    expect(css).toMatch(/data-multiline\]\) \{[^}]*height: auto/);
    for (const variable of cubeVariablesRead(css)) expect(themeVariables().light.has(variable), variable).toBe(true);
  });
});

describe("TextArea: accessibility", () => {
  it("has no axe violations", async () => {
    const { container } = render(<TextArea label="Notes" description="Help" error="Required" leadingVisual={<svg />} />);
    await expectNoAxeViolations(container);
  });
});

describe("TextArea: character count", () => {
  it("counts what is typed against maxLength", async () => {
    render(<TextArea label="A" showCount maxLength={20} />);
    expect(screen.getByText("0 / 20")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("A"), "one{Enter}two");
    expect(screen.getByText("7 / 20")).toBeInTheDocument();
  });
});

describe("TextArea: autoGrow", () => {
  const scrollHeight = (value: number) => vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(value);

  it("is off by default: no attribute, no height handed to the CSS", () => {
    render(<TextArea label="A" />);
    expect(screen.getByLabelText("A")).not.toHaveAttribute("data-auto-grow");
    expect(screen.getByLabelText("A").style.getPropertyValue("--textarea-height")).toBe("");
  });

  it("hands its text height to the CSS as --textarea-height, and re-measures as the user types", async () => {
    const spy = scrollHeight(60);
    render(<TextArea label="A" autoGrow />);
    const box = screen.getByLabelText("A");
    expect(box).toHaveAttribute("data-auto-grow");
    expect(box.style.getPropertyValue("--textarea-height")).toBe("60px");
    spy.mockReturnValue(100);
    await userEvent.type(box, "x");
    expect(box.style.getPropertyValue("--textarea-height")).toBe("100px");
    spy.mockRestore();
  });

  it("stops at maxRows, marks itself capped, and scrolls", () => {
    const spy = scrollHeight(200);
    const computed = vi.spyOn(window, "getComputedStyle").mockReturnValue({ lineHeight: "20px", paddingTop: "0px", paddingBottom: "0px" } as CSSStyleDeclaration);
    render(<TextArea label="A" autoGrow maxRows={4} />);
    const box = screen.getByLabelText("A");
    expect(box.style.getPropertyValue("--textarea-height")).toBe("80px");
    expect(box).toHaveAttribute("data-capped");
    computed.mockRestore();
    spy.mockRestore();
  });

  it("does not cap below maxRows", () => {
    const spy = scrollHeight(50);
    const computed = vi.spyOn(window, "getComputedStyle").mockReturnValue({ lineHeight: "20px", paddingTop: "0px", paddingBottom: "0px" } as CSSStyleDeclaration);
    render(<TextArea label="A" autoGrow maxRows={4} />);
    const box = screen.getByLabelText("A");
    expect(box.style.getPropertyValue("--textarea-height")).toBe("50px");
    expect(box).not.toHaveAttribute("data-capped");
    computed.mockRestore();
    spy.mockRestore();
  });
});
