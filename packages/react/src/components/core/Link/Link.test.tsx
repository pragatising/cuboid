import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
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

  describe("size and weight", () => {
    it("standalone is the md font and the body weight by default", () => {
      render(<Link href="/x">Go</Link>);
      expect(screen.getByRole("link").style.font).not.toBe("");
      expect(screen.getByRole("link").style.fontWeight).toBe(String(tokens.light.text.body.weight));
    });

    it.each(["sm", "md", "lg"] as const)("size %s sets the font from text.size.%s", (size) => {
      const { container } = render(<Link href="/x" size={size}>Go</Link>);
      const link = container.querySelector("a") as HTMLElement;
      expect(link.style.fontSize).toBe(tokens.light.text.size[size].match(/ ([\d.]+rem)/)?.[1]);
    });

    it("weight sets the weight from fontWeight, with or without a size", () => {
      const { rerender } = render(<Link href="/x" weight="semibold">Go</Link>);
      expect(screen.getByRole("link").style.fontWeight).toBe(String(tokens.light.fontWeight.semibold));
      rerender(<Link href="/x" size="lg" weight="medium">Go</Link>);
      expect(screen.getByRole("link").style.fontWeight).toBe(String(tokens.light.fontWeight.medium));
    });

    it("inline inherits the font from its parent unless a size or weight is given", () => {
      const { rerender } = render(<Link href="/x" variant="inline">Go</Link>);
      expect(screen.getByRole("link").style.fontSize).toBe("");
      expect(screen.getByRole("link").style.fontWeight).toBe("");
      rerender(<Link href="/x" variant="inline" weight="medium">Go</Link>);
      expect(screen.getByRole("link").style.fontWeight).toBe(String(tokens.light.fontWeight.medium));
      expect(screen.getByRole("link").style.fontSize).toBe("");
    });
  });

  describe("underline", () => {
    it("is always by default, and none for inherit", () => {
      const { rerender } = render(<Link href="/x">Go</Link>);
      expect(screen.getByRole("link")).toHaveAttribute("data-underline", "always");
      rerender(<Link href="/x" variant="inherit">Go</Link>);
      expect(screen.getByRole("link")).toHaveAttribute("data-underline", "none");
    });

    it.each(["always", "hover", "none"] as const)("takes %s", (underline) => {
      render(<Link href="/x" underline={underline}>Go</Link>);
      expect(screen.getByRole("link")).toHaveAttribute("data-underline", underline);
    });
  });

  describe("color", () => {
    it("takes an fgColor token path, used at rest and on hover", () => {
      render(<Link href="/x" color="success.strong">Go</Link>);
      const link = screen.getByRole("link");
      expect(link.style.getPropertyValue("--link-fg-rest")).toBe(tokens.light.fgColor.success.strong);
      expect(link.style.getPropertyValue("--link-fg-hover")).toBe(tokens.light.fgColor.success.strong);
      expect(link).toHaveAttribute("data-custom-color");
    });

    it("takes any CSS colour, on every variant (including inherit)", () => {
      const { rerender } = render(<Link href="/x" color="#e01280">Go</Link>);
      expect(screen.getByRole("link").style.getPropertyValue("--link-fg-rest")).toBe("#e01280");
      rerender(<Link href="/x" variant="inherit" color="rebeccapurple">Go</Link>);
      expect(screen.getByRole("link").style.getPropertyValue("--link-fg-rest")).toBe("rebeccapurple");
    });

    it("without a colour, the link tokens are used and there is no custom-colour mark", () => {
      render(<Link href="/x">Go</Link>);
      expect(screen.getByRole("link")).not.toHaveAttribute("data-custom-color");
    });

    it("follows the mode for a token colour", () => {
      render(<Link href="/x" color="success.strong">Go</Link>);
      act(() => setMode("dark"));
      expect(screen.getByRole("link").style.getPropertyValue("--link-fg-rest")).toBe(tokens.dark.fgColor.success.strong);
    });
  });

  describe("inactive", () => {
    it("looks disabled, stays focusable and ignores clicks, without leaving the page", async () => {
      const onClick = vi.fn();
      render(<Link href="/x" inactive onClick={onClick}>Go</Link>);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("aria-disabled", "true");
      expect(link).toHaveAttribute("data-inactive");
      await userEvent.tab();
      expect(link).toHaveFocus();
      await userEvent.click(link);
      expect(onClick).not.toHaveBeenCalled();
    });

    it("is active otherwise", async () => {
      const onClick = vi.fn((e: React.MouseEvent) => e.preventDefault());
      render(<Link href="/x" onClick={onClick}>Go</Link>);
      await userEvent.click(screen.getByRole("link"));
      expect(onClick).toHaveBeenCalledOnce();
      expect(screen.getByRole("link")).not.toHaveAttribute("aria-disabled");
    });
  });

  it("has no axe violations", async () => {
    const { container } = render(<Link href="/x">Go</Link>);
    await expectNoAxeViolations(container);
  });
});
