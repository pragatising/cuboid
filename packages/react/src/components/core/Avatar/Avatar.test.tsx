import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { behavesAsComponent, expectNoAxeViolations } from "../../../test/testing";
import { Avatar } from "./Avatar";
import classes from "./Avatar.module.css";

behavesAsComponent({ Component: Avatar, dataComponent: "Avatar", baseClassName: classes.Avatar, props: { name: "Ada Lovelace" } });
behavesAsComponent({
  Component: Avatar.Stack,
  dataComponent: "Avatar.Stack",
  baseClassName: classes.Stack,
  props: { children: <Avatar name="Ada" /> },
});

describe("Avatar", () => {
  it("draws the first letter of the name, in capitals, and is named by it", () => {
    render(<Avatar name="ada lovelace" />);
    const avatar = screen.getByRole("img", { name: "ada lovelace" });
    expect(avatar).toHaveTextContent("A");
  });

  it("gives the same name the same shade, and different names can differ", () => {
    const { container } = render(
      <>
        <Avatar name="Ada" />
        <Avatar name="Ada" />
        <Avatar name="Grace" />
        <Avatar name="Linus" />
        <Avatar name="Margaret" />
      </>,
    );
    const shades = [...container.querySelectorAll("[data-shade]")].map((el) => el.getAttribute("data-shade"));
    expect(shades[0]).toBe(shades[1]);
    expect(new Set(shades).size).toBeGreaterThan(1);
    expect(shades).not.toContain("gray");
  });

  it("is a gray person icon, hidden from assistive technology, with no name", () => {
    const { container } = render(<Avatar />);
    const avatar = container.querySelector('[data-component="Avatar"]') as HTMLElement;
    expect(avatar).toHaveAttribute("data-shade", "gray");
    expect(avatar).toHaveAttribute("aria-hidden", "true");
    expect(avatar.querySelector('[data-component="Icon"]')).not.toBeNull();
  });

  it("takes a shade, and its colours from the avatar tokens", () => {
    const { container } = render(<Avatar name="Ada" shade="emerald" />);
    const avatar = container.querySelector('[data-component="Avatar"]') as HTMLElement;
    expect(avatar.style.getPropertyValue("--avatar-bg")).toBe(tokens.light.avatar.color.emerald.bgColor);
    expect(avatar.style.getPropertyValue("--avatar-size")).toBe(tokens.light.avatar.size.md);
  });

  it("draws a photo over the circle and keeps the name", () => {
    const { container } = render(<Avatar name="Ada" src="/ada.png" size="lg" />);
    expect(container.querySelector("img")).toHaveAttribute("src", "/ada.png");
    expect(screen.getByRole("img", { name: "Ada" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Avatar name="Ada" />);
    await expectNoAxeViolations(container);
  });
});

describe("Avatar.Stack", () => {
  const people = ["Ada", "Grace", "Linus", "Margaret", "Alan"].map((name) => <Avatar key={name} name={name} />);

  it("draws the first three and counts the rest", () => {
    const { container } = render(<Avatar.Stack>{people}</Avatar.Stack>);
    expect(container.querySelectorAll('[data-component="Avatar"]')).toHaveLength(3);
    expect(screen.getByRole("img", { name: "2 more" })).toHaveTextContent("+2");
  });

  it("draws no count when they all fit, and takes `max`", () => {
    const { container } = render(<Avatar.Stack max={5}>{people}</Avatar.Stack>);
    expect(container.querySelectorAll('[data-component="Avatar"]')).toHaveLength(5);
    expect(container.querySelector('[data-component="Avatar.Count"]')).toBeNull();
  });

  it("gives its size to the avatars in it", () => {
    const { container } = render(<Avatar.Stack size="sm">{people.slice(0, 2)}</Avatar.Stack>);
    for (const avatar of container.querySelectorAll('[data-component="Avatar"]')) expect(avatar).toHaveAttribute("data-size", "sm");
  });

  it("has an add button only when it can add, named and calling back", async () => {
    const onAdd = vi.fn();
    const { rerender } = render(<Avatar.Stack>{people.slice(0, 1)}</Avatar.Stack>);
    expect(screen.queryByRole("button")).toBeNull();
    rerender(<Avatar.Stack onAdd={onAdd}>{people.slice(0, 1)}</Avatar.Stack>);
    await userEvent.click(screen.getByRole("button", { name: "Add person" }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it("is the add button alone when it has no avatars", () => {
    render(<Avatar.Stack onAdd={() => {}} />);
    expect(screen.getByRole("button", { name: "Add person" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Avatar.Stack aria-label="Collaborators" onAdd={() => {}}>
        {people}
      </Avatar.Stack>,
    );
    await expectNoAxeViolations(container);
  });
});
