import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { setMode } from "../../../mode";
import { behavesAsComponent, expectNoAxeViolations } from "../../../test/testing";
import { Header } from "./Header";
import classes from "./Header.module.css";

behavesAsComponent({ Component: Header, dataComponent: "Header", baseClassName: classes.Header });
behavesAsComponent({ Component: Header.Divider, dataComponent: "Header.Divider", baseClassName: classes.Divider });

const part = (container: HTMLElement, name: string) => container.querySelector<HTMLElement>(`[data-component="${name}"]`)!;

describe("Header", () => {
  it("is a banner landmark", () => {
    render(<Header />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("holds its slots in a row, spread apart", () => {
    const { container } = render(
      <Header>
        <Header.Leading>Lead</Header.Leading>
        <Header.Trailing>Trail</Header.Trailing>
      </Header>,
    );
    expect(part(container, "Header.Leading")).toHaveTextContent("Lead");
    expect(part(container, "Header.Trailing")).toHaveTextContent("Trail");
    expect(screen.getByRole("banner").style.justifyContent).toBe("space-between");
  });

  it("takes height, padding, colours and gaps from the siteHeader tokens", () => {
    const { container } = render(
      <Header>
        <Header.Leading>a</Header.Leading>
        <Header.Trailing>b</Header.Trailing>
      </Header>,
    );
    const header = screen.getByRole("banner");
    const t = tokens.light.siteHeader;
    expect(header.style.minHeight).toBe(t.sizes.height);
    expect(header.style.paddingBlock).toBe(t.sizes.paddingBlock);
    expect(header.style.paddingInlineStart).toBe(t.sizes.paddingInlineStart);
    expect(header.style.paddingInlineEnd).toBe(t.sizes.paddingInlineEnd);
    expect(header).toHaveStyle({ backgroundColor: t.color.background });
    expect(part(container, "Header.Leading").style.gap).toBe(t.sizes.leadingGap);
    expect(part(container, "Header.Trailing").style.gap).toBe(t.sizes.trailingGap);
  });

  it("takes any CSS prop, like Box", () => {
    render(<Header {...({ position: "sticky", top: 0 } as object)} />);
    expect(screen.getByRole("banner").style.position).toBe("sticky");
  });

  it("uses the dark tokens in dark mode", () => {
    act(() => setMode("dark"));
    render(<Header />);
    expect(screen.getByRole("banner")).toHaveStyle({ backgroundColor: tokens.dark.siteHeader.color.background });
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <Header>
        <Header.Leading>a</Header.Leading>
        <Header.Trailing>b</Header.Trailing>
      </Header>,
    );
    await expectNoAxeViolations(container);
  });
});

describe("Header.Divider", () => {
  it("is decorative and takes its size and colour from the siteHeader tokens", () => {
    const { container } = render(<Header.Divider />);
    const divider = part(container, "Header.Divider");
    expect(divider).toHaveAttribute("aria-hidden", "true");
    expect(divider.style.width).toBe(tokens.light.siteHeader.sizes.dividerWidth);
    expect(divider.style.height).toBe(tokens.light.siteHeader.sizes.dividerHeight);
    expect(divider).toHaveStyle({ backgroundColor: tokens.light.siteHeader.color.divider });
  });
});
