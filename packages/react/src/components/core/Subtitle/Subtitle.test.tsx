import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { setMode } from "../../../mode";
import { behavesAsComponent, expectNoAxeViolations, renderInMode } from "../../../test/testing";
import { Subtitle } from "./Subtitle";
import classes from "./Subtitle.module.css";

behavesAsComponent({ Component: Subtitle, dataComponent: "Subtitle", baseClassName: classes.Subtitle, props: { children: "Lead text" } });

// jsdom re-serialises a `font` shorthand (spaces around "/", double quotes), so compare normalised.
const normaliseFont = (font: string) => font.replace(/\s*\/\s*/g, "/").replace(/"/g, "'");

describe("Subtitle", () => {
  it("is a paragraph by default and can render as another element", () => {
    const { rerender } = render(<Subtitle>Lead text</Subtitle>);
    expect(screen.getByText("Lead text").tagName).toBe("P");
    rerender(<Subtitle as="h2">Lead text</Subtitle>);
    expect(screen.getByText("Lead text").tagName).toBe("H2");
  });

  it("sets the font from the subtitle.font token", () => {
    render(<Subtitle>Lead text</Subtitle>);
    expect(normaliseFont(screen.getByText("Lead text").style.font)).toBe(normaliseFont(tokens.light.subtitle.font));
  });

  it("is coloured by the subtitle.fgColor token unless a colour is chosen", () => {
    render(<Subtitle>Lead text</Subtitle>);
    expect(screen.getByText("Lead text")).toHaveStyle({ color: tokens.light.subtitle.fgColor });
  });

  it.each(["neutral.contrast", "success.strong", "danger.strong"] as const)("colours the text with fgColor %s", (path) => {
    const [group, key] = path.split(".");
    render(<Subtitle color={path}>Lead text</Subtitle>);
    expect(screen.getByText("Lead text")).toHaveStyle({ color: (tokens.light.fgColor as Record<string, Record<string, string>>)[group][key] });
  });

  it("lets the consumer's style override the token styles", () => {
    render(<Subtitle style={{ color: "rgb(1, 2, 3)" }}>Lead text</Subtitle>);
    expect(screen.getByText("Lead text")).toHaveStyle({ color: "rgb(1, 2, 3)" });
  });

  it("uses the dark tokens in dark mode and follows a mode change while mounted", () => {
    renderInMode(<Subtitle>Lead text</Subtitle>, "dark");
    expect(screen.getByText("Lead text")).toHaveStyle({ color: tokens.dark.subtitle.fgColor });
    act(() => setMode("light"));
    expect(screen.getByText("Lead text")).toHaveStyle({ color: tokens.light.subtitle.fgColor });
  });

  it("has no axe violations", async () => {
    const { container } = render(<Subtitle>Lead text</Subtitle>);
    await expectNoAxeViolations(container);
  });
});
