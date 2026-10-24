import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { behavesAsComponent, expectNoAxeViolations } from "../../../test/testing";
import { TileIcon } from "./TileIcon";
import classes from "./TileIcon.module.css";

behavesAsComponent({ Component: TileIcon, dataComponent: "TileIcon", baseClassName: classes.TileIcon, props: { name: "home" } });

const tile = (container: HTMLElement) => container.querySelector('[data-component="TileIcon"]') as HTMLElement;

describe("TileIcon", () => {
  it("is the Icon component in a tile, decorative by default", () => {
    const { container } = render(<TileIcon name="home" />);
    expect(tile(container).querySelector('[data-component="Icon"]')).toBeInTheDocument();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("can be named, and is then an image", () => {
    render(<TileIcon name="home" label="Home" />);
    expect(screen.getByRole("img", { name: "Home" })).toBeInTheDocument();
  });

  it("fills with canvas.inset by default (as --tile-icon-bg, which the CSS paints), and the glyph is neutral.muted", () => {
    const { container } = render(<TileIcon name="home" />);
    expect(tile(container).style.getPropertyValue("--tile-icon-bg")).toBe(tokens.light.bgColor.canvas.inset);
    expect(container.querySelector('[data-component="Icon"]')).toHaveStyle({ color: tokens.light.fgColor.neutral.muted });
  });

  it("takes a bgColor token, a palette colour or any CSS colour for the fill", () => {
    const { container, rerender } = render(<TileIcon name="home" backgroundColor="informational.subtle" />);
    expect(tile(container).style.getPropertyValue("--tile-icon-bg")).toBe(tokens.light.bgColor.informational.subtle);
    rerender(<TileIcon name="home" backgroundColor="#ff0000" />);
    expect(tile(container).style.getPropertyValue("--tile-icon-bg")).toBe("#ff0000");
  });

  it("takes an fgColor token or any CSS colour for the glyph", () => {
    const { container, rerender } = render(<TileIcon name="home" color="neutral.contrast" />);
    expect(container.querySelector('[data-component="Icon"]')).toHaveStyle({ color: tokens.light.fgColor.neutral.contrast });
    rerender(<TileIcon name="home" color="#00ff00" />);
    expect(container.querySelector('[data-component="Icon"]')).toHaveStyle({ color: "#00ff00" });
  });

  it("throws on a colour that is neither a token nor CSS, so a typo is caught", () => {
    expect(() => render(<TileIcon name="home" backgroundColor={"canvas.nope" as never} />)).toThrow(/Unknown colour/);
  });

  it("has no axe violations", async () => {
    const { container } = render(<TileIcon name="home" label="Home" />);
    await expectNoAxeViolations(container);
  });
});
