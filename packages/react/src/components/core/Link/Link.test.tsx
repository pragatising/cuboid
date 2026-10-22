import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { setMode } from "../../../mode";
import { behavesAsComponent, expectNoAxeViolations, renderInMode } from "../../../test/testing";
import { Link } from "./Link";
import classes from "./Link.module.css";

behavesAsComponent({ Component: Link, dataComponent: "Link", baseClassName: classes.Link, props: { href: "/x", children: "Go" } });

describe("Link", () => {
  it("is an anchor with its href", () => {
    render(<Link href="/docs">Docs</Link>);
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute("href", "/docs");
  });

  it("hands the standalone rest and hover colours to the CSS as variables", () => {
    render(<Link href="/x">Go</Link>);
    const el = screen.getByRole("link");
    expect(el.style.getPropertyValue("--link-fg-rest")).toBe(tokens.light.link.standalone.fgColor.rest);
    expect(el.style.getPropertyValue("--link-fg-hover")).toBe(tokens.light.link.standalone.fgColor.hover);
  });

  it("uses the inline colours for variant=inline", () => {
    render(<Link href="/x" variant="inline">Go</Link>);
    expect(screen.getByRole("link").style.getPropertyValue("--link-fg-rest")).toBe(tokens.light.link.inline.fgColor.rest);
  });

  it("sets no colour variables for variant=inherit", () => {
    render(<Link href="/x" variant="inherit">Go</Link>);
    expect(screen.getByRole("link").style.getPropertyValue("--link-fg-rest")).toBe("");
  });

  it("opens in a new tab safely when external, with the icon", () => {
    const { container } = render(<Link href="https://x.test" external>Go</Link>);
    const el = screen.getByRole("link");
    expect(el).toHaveAttribute("target", "_blank");
    expect(el).toHaveAttribute("rel", "noopener noreferrer");
    expect(container.querySelector('[data-component="Icon"]')).toBeInTheDocument();
  });

  it("keeps a consumer rel alongside the safe ones", () => {
    render(<Link href="https://x.test" external rel="author">Go</Link>);
    expect(screen.getByRole("link")).toHaveAttribute("rel", "author noopener noreferrer");
  });

  it("can hide the external icon", () => {
    const { container } = render(<Link href="https://x.test" external showExternalIcon={false}>Go</Link>);
    expect(container.querySelector('[data-component="Icon"]')).not.toBeInTheDocument();
  });

  it("does not open a new tab when not external", () => {
    render(<Link href="/x">Go</Link>);
    expect(screen.getByRole("link")).not.toHaveAttribute("target");
  });

  it("renders as another element with as", () => {
    render(<Link as="button" type="button">Go</Link>);
    expect(screen.getByRole("button", { name: "Go" })).toHaveAttribute("data-component", "Link");
  });

  it("uses the dark tokens in dark mode", () => {
    renderInMode(<Link href="/x">Go</Link>, "dark");
    expect(screen.getByRole("link").style.getPropertyValue("--link-fg-rest")).toBe(tokens.dark.link.standalone.fgColor.rest);
  });

  it("re-renders with the new mode's tokens when the mode changes while mounted", () => {
    render(<Link href="/x">Go</Link>);
    act(() => setMode("dark"));
    expect(screen.getByRole("link").style.getPropertyValue("--link-fg-hover")).toBe(tokens.dark.link.standalone.fgColor.hover);
  });

  it("has no axe violations", async () => {
    const { container } = render(<Link href="/x">Go</Link>);
    await expectNoAxeViolations(container);
  });
});
