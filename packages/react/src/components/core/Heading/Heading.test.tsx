import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { setMode } from "../../../mode";
import { behavesAsComponent, expectNoAxeViolations, renderInMode } from "../../../test/testing";
import { Heading } from "./Heading";
import classes from "./Heading.module.css";

behavesAsComponent({ Component: Heading, dataComponent: "Heading", baseClassName: classes.Heading, props: { children: "Title" } });

// jsdom re-serialises a `font` shorthand (spaces around "/", double quotes), so compare normalised.
const normaliseFont = (font: string) => font.replace(/\s*\/\s*/g, "/").replace(/"/g, "'");

describe("Heading", () => {
  it("is a level-2 heading by default", () => {
    render(<Heading>Title</Heading>);
    expect(screen.getByRole("heading", { level: 2, name: "Title" })).toBeInTheDocument();
  });

  it.each([1, 2, 3, 4, 5, 6] as const)("renders an h%s for as=h%s", (level) => {
    render(<Heading as={`h${level}`}>Title</Heading>);
    expect(screen.getByRole("heading", { level })).toBeInTheDocument();
  });

  it("looks large by default, whatever the level", () => {
    render(<Heading as="h4">Title</Heading>);
    expect(normaliseFont(screen.getByRole("heading").style.font)).toBe(normaliseFont(tokens.light.heading.size.lg));
  });

  it.each(["sm", "md", "lg"] as const)("sets the font from the heading.size.%s token for size=%s", (size) => {
    render(<Heading size={size}>Title</Heading>);
    expect(normaliseFont(screen.getByRole("heading").style.font)).toBe(normaliseFont(tokens.light.heading.size[size]));
  });

  it("is coloured by the heading.fgColor token unless a colour is chosen", () => {
    render(<Heading>Title</Heading>);
    expect(screen.getByRole("heading")).toHaveStyle({ color: tokens.light.heading.fgColor });
  });

  it.each(["neutral.muted", "success.strong", "danger.strong"] as const)("colours the heading with fgColor %s", (path) => {
    const [group, key] = path.split(".");
    render(<Heading color={path}>Title</Heading>);
    expect(screen.getByRole("heading")).toHaveStyle({ color: (tokens.light.fgColor as Record<string, Record<string, string>>)[group][key] });
  });

  it("lets the consumer's style override the token styles", () => {
    render(<Heading style={{ color: "rgb(1, 2, 3)" }}>Title</Heading>);
    expect(screen.getByRole("heading")).toHaveStyle({ color: "rgb(1, 2, 3)" });
  });

  it("uses the dark tokens in dark mode and follows a mode change while mounted", () => {
    renderInMode(<Heading>Title</Heading>, "dark");
    expect(screen.getByRole("heading")).toHaveStyle({ color: tokens.dark.heading.fgColor });
    act(() => setMode("light"));
    expect(screen.getByRole("heading")).toHaveStyle({ color: tokens.light.heading.fgColor });
  });

  it("has no axe violations", async () => {
    const { container } = render(<Heading>Title</Heading>);
    await expectNoAxeViolations(container);
  });
});
