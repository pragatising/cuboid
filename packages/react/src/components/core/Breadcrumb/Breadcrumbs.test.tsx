import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { setMode } from "../../../mode";
import { behavesAsComponent, expectNoAxeViolations } from "../../../test/testing";
import { BreadcrumbLink } from "./BreadcrumbLink";
import { Breadcrumbs } from "./Breadcrumbs";
import linkClasses from "./BreadcrumbLink.module.css";
import classes from "./Breadcrumbs.module.css";

behavesAsComponent({
  Component: Breadcrumbs,
  dataComponent: "Breadcrumbs",
  baseClassName: classes.Breadcrumbs,
  props: { items: [{ label: "Home", href: "/" }, { label: "Now" }] },
});
behavesAsComponent({
  Component: BreadcrumbLink,
  dataComponent: "BreadcrumbLink",
  baseClassName: linkClasses.BreadcrumbLink,
  props: { href: "/x", children: "Home" },
});

const trail = [
  { label: "Dashboard", href: "/d" },
  { label: "Customers", href: "/c" },
  { label: "Details" },
];

describe("Breadcrumbs", () => {
  it("is a navigation landmark with a default label", () => {
    render(<Breadcrumbs items={trail} />);
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
  });

  it("lets the consumer name the landmark", () => {
    render(<Breadcrumbs items={trail} aria-label="You are here" />);
    expect(screen.getByRole("navigation", { name: "You are here" })).toBeInTheDocument();
  });

  it("renders every item in order, in a list", () => {
    render(<Breadcrumbs items={trail} />);
    expect(screen.getAllByRole("listitem").map((li) => li.textContent?.replace("/", ""))).toEqual(["Dashboard", "Customers", "Details"]);
  });

  it("links the earlier items and marks the last as the current page", () => {
    render(<Breadcrumbs items={trail} />);
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/d");
    expect(screen.queryByRole("link", { name: "Details" })).not.toBeInTheDocument();
    expect(screen.getByText("Details")).toHaveAttribute("aria-current", "page");
  });

  it("treats an item without an href as the current page", () => {
    render(<Breadcrumbs items={[{ label: "A" }, { label: "B", href: "/b" }]} />);
    expect(screen.queryByRole("link", { name: "A" })).not.toBeInTheDocument();
  });

  it("renders nothing for an empty trail", () => {
    const { container } = render(<Breadcrumbs items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("hides the separators from assistive technology", () => {
    const { container } = render(<Breadcrumbs items={trail} />);
    const separators = container.querySelectorAll(`.${classes.Separator}`);
    expect(separators).toHaveLength(2);
    separators.forEach((s) => expect(s).toHaveAttribute("aria-hidden", "true"));
  });

  it("takes spacing and separator colour from the breadcrumb tokens", () => {
    const { container } = render(<Breadcrumbs items={trail} />);
    expect((container.querySelector("ol") as HTMLElement).style.gap).toBe(tokens.light.breadcrumb.sizes.gap);
    expect(container.querySelector(`.${classes.Separator}`)).toHaveStyle({ color: tokens.light.breadcrumb.separator.fgColor });
  });

  it("has no axe violations", async () => {
    const { container } = render(<Breadcrumbs items={trail} />);
    await expectNoAxeViolations(container);
  });
});

describe("BreadcrumbLink", () => {
  it("hands the state colours to the CSS as variables", () => {
    render(<BreadcrumbLink href="/x">Home</BreadcrumbLink>);
    const el = screen.getByRole("link");
    expect(el.style.getPropertyValue("--breadcrumb-fg-hover")).toBe(tokens.light.breadcrumb.link.fgColor.hover);
    expect(el.style.getPropertyValue("--breadcrumb-bg-hover")).toBe(tokens.light.breadcrumb.link.bgColor.hover);
  });

  it("takes padding and radius from the breadcrumb tokens", () => {
    render(<BreadcrumbLink href="/x">Home</BreadcrumbLink>);
    const el = screen.getByRole("link");
    expect(el.style.paddingInline).toBe(tokens.light.breadcrumb.sizes.itemPaddingInline);
    expect(el.style.borderRadius).toBe(tokens.light.breadcrumb.sizes.itemBorderRadius);
  });

  it("renders the current page as text, not a link", () => {
    render(<BreadcrumbLink href="/x" current>Here</BreadcrumbLink>);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Here")).toHaveAttribute("aria-current", "page");
  });

  it("re-renders with the new mode's tokens when the mode changes while mounted", () => {
    render(<BreadcrumbLink href="/x">Home</BreadcrumbLink>);
    act(() => setMode("dark"));
    expect(screen.getByRole("link").style.getPropertyValue("--breadcrumb-fg-active")).toBe(tokens.dark.breadcrumb.link.fgColor.active);
  });
});
