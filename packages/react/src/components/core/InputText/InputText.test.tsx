import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { behavesAsFormControl, expectNoAxeViolations } from "../../../test/testing";
import { cubeVariablesRead, readSource, resolveVariable, themeVariables } from "../../../test/themeCss";
import { InputText } from "./InputText";

behavesAsFormControl({ Component: InputText, dataComponent: "InputText" });

const shell = (container: HTMLElement) => container.querySelector('[data-component="InputField.Shell"]') as HTMLElement;

describe("InputText: element", () => {
  it("is a text input named by its label", () => {
    render(<InputText label="Name" />);
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveAttribute("type", "text");
  });

  it("passes native input props to the input and the ref to the input", () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<InputText label="Email" type="email" name="email" placeholder="you@example.com" ref={ref} />);
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("name", "email");
    expect(input).toHaveAttribute("placeholder", "you@example.com");
    expect(ref.current).toBe(input);
  });

  it("takes an id for the input, and builds one when there is none", () => {
    const { rerender } = render(<InputText label="A" id="mine" />);
    expect(screen.getByLabelText("A")).toHaveAttribute("id", "mine");
    rerender(<InputText label="A" />);
    expect(screen.getByLabelText("A").id).not.toBe("");
  });

  it("merges className onto the input and wrapperClassName onto the wrapper, with the style on the input", () => {
    const { container } = render(<InputText label="A" className="on-input" wrapperClassName="on-wrapper" />);
    expect(screen.getByLabelText("A")).toHaveClass("on-input");
    expect(container.querySelector('[data-component="InputText"]')).toHaveClass("on-wrapper");
  });

  it("types and fires onChange", async () => {
    let value = "";
    render(<InputText label="A" onChange={(event) => (value = event.target.value)} />);
    await userEvent.type(screen.getByLabelText("A"), "hi");
    expect(value).toBe("hi");
  });
});

describe("InputText: description, error and states", () => {
  it("points aria-describedby at the description", () => {
    render(<InputText label="A" description="Your full name" />);
    expect(screen.getByLabelText("A")).toHaveAccessibleDescription("Your full name");
  });

  it("an error sets aria-invalid, is described, and shows after the description", () => {
    render(<InputText label="A" description="Help" error="Required" />);
    const input = screen.getByLabelText("A");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Help Required");
  });

  it("is not invalid without an error", () => {
    render(<InputText label="A" />);
    expect(screen.getByLabelText("A")).not.toHaveAttribute("aria-invalid");
  });

  it("keeps a consumer's aria-describedby", () => {
    render(
      <>
        <span id="extra">Extra</span>
        <InputText label="A" description="Help" aria-describedby="extra" />
      </>,
    );
    expect(screen.getByLabelText("A")).toHaveAccessibleDescription("Help Extra");
  });

  it("disabled and read-only reach the input and the shell", () => {
    const { container, rerender } = render(<InputText label="A" disabled />);
    expect(screen.getByLabelText("A")).toBeDisabled();
    expect(shell(container)).toHaveAttribute("data-disabled");
    rerender(<InputText label="A" readOnly />);
    expect(screen.getByLabelText("A")).toHaveAttribute("readonly");
    expect(shell(container)).toHaveAttribute("data-readonly");
  });

  it("defaults to size md, and size is an attribute", () => {
    const { container, rerender } = render(<InputText label="A" />);
    expect(shell(container)).toHaveAttribute("data-size", "md");
    rerender(<InputText label="A" size="lg" />);
    expect(shell(container)).toHaveAttribute("data-size", "lg");
  });

  it("renders the leading and trailing visuals hidden from assistive technology", () => {
    render(<InputText label="A" leadingVisual={<svg data-testid="lead" />} trailingVisual={<svg data-testid="trail" />} />);
    expect(screen.getByTestId("lead").parentElement).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByTestId("trail").parentElement).toHaveAttribute("aria-hidden", "true");
  });

  it("sets no inline style: the look is in the CSS", () => {
    const { container } = render(<InputText label="A" />);
    expect(shell(container).getAttribute("style")).toBeNull();
    expect(screen.getByLabelText("A").getAttribute("style")).toBeNull();
  });
});

// jsdom does not evaluate component CSS, so the look is checked at its source: the stylesheets only read variables the token
// build publishes, and the ones they map resolve (in both modes) to the same values as the JavaScript token tree.
describe("InputField and InputText CSS read the published token variables", () => {
  const sources = ["InputField/InputField.module.css", "InputText/InputText.module.css"];

  it.each(sources)("%s reads only --cube-* variables that exist in the built theme.css, in both modes", (file) => {
    const read = cubeVariablesRead(readSource(`src/components/core/${file}`));
    expect(read.length).toBeGreaterThan(0);
    for (const variable of read) {
      expect(themeVariables().light.has(variable), `${variable} (light)`).toBe(true);
      expect(themeVariables().dark.has(variable), `${variable} (dark)`).toBe(true);
    }
  });

  it.each(["light", "dark"] as const)("resolves the field's colours to tokens.%s.input", (mode) => {
    const { input } = tokens[mode];
    expect(resolveVariable("--cube-input-bgColor-rest", mode)).toBe(input.bgColor.rest);
    expect(resolveVariable("--cube-input-bgColor-disabled", mode)).toBe(input.bgColor.disabled);
    expect(resolveVariable("--cube-input-borderColor-error", mode)).toBe(input.borderColor.error);
    expect(resolveVariable("--cube-input-fgColor-placeholder", mode)).toBe(input.fgColor.placeholder);
    expect(resolveVariable("--cube-input-error-fgColor", mode)).toBe(input.error.fgColor);
  });

  it("the sizes are the control heights of the same name: sm 24, md 28, lg 32", () => {
    expect(tokens.light.size.control.sm.size).toBe("1.5rem");
    expect(tokens.light.size.control.md.size).toBe("1.75rem");
    expect(tokens.light.size.control.lg.size).toBe("2rem");
    expect("xs" in tokens.light.size.control).toBe(false);
    const css = readSource("src/components/core/InputField/InputField.module.css");
    expect(css).toMatch(/data-size="sm"\]\) \{\s*--field-height: var\(--cube-size-control-sm-size\)/);
    expect(css).toMatch(/data-size="md"\]\) \{\s*--field-height: var\(--cube-size-control-md-size\)/);
    expect(css).toMatch(/data-size="lg"\]\) \{\s*--field-height: var\(--cube-size-control-lg-size\)/);
  });
});

describe("InputText: accessibility", () => {
  it("has no axe violations", async () => {
    const { container } = render(<InputText label="Name" description="Help" error="Required" leadingVisual={<svg />} />);
    await expectNoAxeViolations(container);
  });
});
