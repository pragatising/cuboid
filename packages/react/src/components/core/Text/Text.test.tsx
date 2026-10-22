import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { setMode } from "../../../mode";
import { behavesAsComponent, expectNoAxeViolations, renderInMode } from "../../../test/testing";
import { Text } from "./Text";
import classes from "./Text.module.css";

behavesAsComponent({ Component: Text, dataComponent: "Text", baseClassName: classes.Text, props: { children: "hello" } });

describe("Text", () => {
  it("is a paragraph by default and can render as another element", () => {
    const { rerender } = render(<Text>hello</Text>);
    expect(screen.getByText("hello").tagName).toBe("P");
    rerender(<Text as="span">hello</Text>);
    expect(screen.getByText("hello").tagName).toBe("SPAN");
  });

  // jsdom re-serialises a `font` shorthand (spaces around "/", double quotes), so compare normalised.
  const normaliseFont = (font: string) => font.replace(/\s*\/\s*/g, "/").replace(/"/g, "'");

  it("sets the font from the text.size token, medium by default", () => {
    render(<Text>hello</Text>);
    expect(normaliseFont(screen.getByText("hello").style.font)).toBe(normaliseFont(tokens.light.text.size.md));
  });

  it.each(["sm", "md", "lg"] as const)("uses the %s font token for size=%s", (size) => {
    render(<Text size={size}>hello</Text>);
    expect(normaliseFont(screen.getByText("hello").style.font)).toBe(normaliseFont(tokens.light.text.size[size]));
  });

  it("is coloured by the text.fgColor token unless a colour is chosen", () => {
    render(<Text>hello</Text>);
    expect(screen.getByText("hello")).toHaveStyle({ color: tokens.light.text.fgColor });
  });

  it.each(["neutral.muted", "neutral.contrast", "success.strong", "danger.strong", "link.default"] as const)(
    "colours the text with fgColor %s",
    (path) => {
      const [group, key] = path.split(".");
      render(<Text color={path}>hello</Text>);
      expect(screen.getByText("hello")).toHaveStyle({ color: (tokens.light.fgColor as Record<string, Record<string, string>>)[group][key] });
    },
  );

  it("can use every foreground token in fgColor, in both modes", () => {
    for (const mode of ["light", "dark"] as const) {
      for (const [group, keys] of Object.entries(tokens[mode].fgColor)) {
        for (const [key, value] of Object.entries(keys as Record<string, string>)) {
          const { unmount } = renderInMode(<Text color={`${group}.${key}` as never}>hello</Text>, mode);
          expect(screen.getByText("hello"), `${mode} fgColor.${group}.${key}`).toHaveStyle({ color: value });
          unmount();
        }
      }
    }
  });

  it.each(["light", "normal", "medium", "semibold"] as const)('sets the %s font weight token for weight="%s"', (weight) => {
    render(<Text weight={weight}>hello</Text>);
    expect(screen.getByText("hello")).toHaveStyle({ fontWeight: String(tokens.light.fontWeight[weight]) });
  });

  it("uses the regular body weight unless a weight is chosen", () => {
    render(<Text>hello</Text>);
    expect(screen.getByText("hello")).toHaveStyle({ fontWeight: String(tokens.light.text.body.weight) });
  });

  it("can change weight while mounted without React's shorthand/longhand style warning", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { rerender } = render(<Text>hello</Text>);
    rerender(<Text weight="semibold">hello</Text>);
    rerender(<Text>hello</Text>);
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it.each(["normal", "nowrap", "pre", "pre-wrap", "pre-line"] as const)('sets data-white-space="%s" for whiteSpace="%s"', (whiteSpace) => {
    render(<Text whiteSpace={whiteSpace}>hello</Text>);
    expect(screen.getByText("hello")).toHaveAttribute("data-white-space", whiteSpace);
  });

  it("sets no white-space attribute unless asked", () => {
    render(<Text>hello</Text>);
    expect(screen.getByText("hello")).not.toHaveAttribute("data-white-space");
  });

  it("truncates only when asked", () => {
    const { rerender } = render(<Text>hello</Text>);
    expect(screen.getByText("hello")).not.toHaveClass(classes.Truncate);
    rerender(<Text truncate>hello</Text>);
    expect(screen.getByText("hello")).toHaveClass(classes.Truncate);
  });

  it("lets the consumer's style override the token styles", () => {
    render(<Text style={{ color: "rgb(1, 2, 3)" }}>hello</Text>);
    expect(screen.getByText("hello")).toHaveStyle({ color: "rgb(1, 2, 3)" });
  });

  it("uses the dark tokens in dark mode and follows a mode change while mounted", () => {
    renderInMode(<Text color="neutral.contrast">hello</Text>, "dark");
    expect(screen.getByText("hello")).toHaveStyle({ color: tokens.dark.fgColor.neutral.contrast });
    act(() => setMode("light"));
    expect(screen.getByText("hello")).toHaveStyle({ color: tokens.light.fgColor.neutral.contrast });
  });

  it("has no axe violations", async () => {
    const { container } = render(<Text>hello</Text>);
    await expectNoAxeViolations(container);
  });
});
