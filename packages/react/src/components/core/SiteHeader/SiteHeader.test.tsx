import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { setMode } from "../../../mode";
import { behavesAsComponent, expectNoAxeViolations } from "../../../test/testing";
import { SiteHeader, SiteHeaderDivider } from "./SiteHeader";
import classes from "./SiteHeader.module.css";

behavesAsComponent({ Component: SiteHeader, dataComponent: "SiteHeader", baseClassName: classes.SiteHeader });
behavesAsComponent({ Component: SiteHeaderDivider, dataComponent: "SiteHeaderDivider", baseClassName: classes.Divider });

describe("SiteHeader", () => {
  it("is a banner landmark", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("renders the leading and trailing regions only when given", () => {
    const { container, rerender } = render(<SiteHeader leading={<span>Lead</span>} />);
    expect(container.querySelector('[data-component="SiteHeader.Leading"]')).toHaveTextContent("Lead");
    expect(container.querySelector('[data-component="SiteHeader.Trailing"]')).not.toBeInTheDocument();
    rerender(<SiteHeader trailing={<span>Trail</span>} />);
    expect(container.querySelector('[data-component="SiteHeader.Leading"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-component="SiteHeader.Trailing"]')).toHaveTextContent("Trail");
  });

  it("takes height, padding, colours and gaps from the siteHeader tokens", () => {
    const { container } = render(<SiteHeader leading="a" trailing="b" />);
    const header = screen.getByRole("banner");
    const t = tokens.light.siteHeader;
    expect(header.style.minHeight).toBe(t.sizes.height);
    expect(header.style.paddingBlock).toBe(t.sizes.paddingBlock);
    expect(header.style.paddingInlineStart).toBe(t.sizes.paddingInlineStart);
    expect(header.style.paddingInlineEnd).toBe(t.sizes.paddingInlineEnd);
    expect(header).toHaveStyle({ backgroundColor: t.color.background });
    expect((container.querySelector('[data-component="SiteHeader.Leading"]') as HTMLElement).style.gap).toBe(t.sizes.leadingGap);
    expect((container.querySelector('[data-component="SiteHeader.Trailing"]') as HTMLElement).style.gap).toBe(t.sizes.trailingGap);
  });

  it("uses the dark tokens in dark mode", () => {
    act(() => setMode("dark"));
    render(<SiteHeader />);
    expect(screen.getByRole("banner")).toHaveStyle({ backgroundColor: tokens.dark.siteHeader.color.background });
  });

  it("has no axe violations", async () => {
    const { container } = render(<SiteHeader leading="a" trailing="b" />);
    await expectNoAxeViolations(container);
  });
});

describe("SiteHeaderDivider", () => {
  it("is decorative and takes its size and colour from the siteHeader tokens", () => {
    const { container } = render(<SiteHeaderDivider />);
    const divider = container.querySelector('[data-component="SiteHeaderDivider"]') as HTMLElement;
    expect(divider).toHaveAttribute("aria-hidden", "true");
    expect(divider.style.width).toBe(tokens.light.siteHeader.sizes.dividerWidth);
    expect(divider.style.height).toBe(tokens.light.siteHeader.sizes.dividerHeight);
    expect(divider).toHaveStyle({ backgroundColor: tokens.light.siteHeader.color.divider });
  });
});
