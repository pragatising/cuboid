import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SmartLinkSettings } from "./SmartLinkSettings";
import type { SmartLinkAttrs } from "./smartLink.read";

const attrs: SmartLinkAttrs = { url: "https://example.com/a", appearance: "embed", height: "" };

function open(props: Partial<SmartLinkAttrs> = {}) {
  const update = vi.fn();
  const onClose = vi.fn();
  render(<SmartLinkSettings anchor={createRef<HTMLElement>()} attrs={{ ...attrs, ...props }} update={update} onClose={onClose} />);
  return { update, onClose, user: userEvent.setup() };
}

describe("link settings", () => {
  it("is a dialog that shows the address and the appearance", () => {
    open();
    expect(screen.getByRole("dialog", { name: "Link settings" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Address" })).toHaveValue("https://example.com/a");
    expect(screen.getByRole("group", { name: "Appearance" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Embed" })).toHaveAttribute("aria-pressed", "true");
  });

  it("changes the appearance", async () => {
    const { update, user } = open();
    await user.click(screen.getByRole("button", { name: "Inline" }));
    expect(update).toHaveBeenCalledWith({ appearance: "inline" });
  });

  it("offers a height only for an embed", () => {
    open({ appearance: "inline" });
    expect(screen.queryByText("Height")).toBeNull();
  });

  it("keeps a new address when it is committed, not on each keystroke", async () => {
    const { update, user } = open();
    const field = screen.getByRole("textbox", { name: "Address" });
    await user.clear(field);
    await user.type(field, "other.com/b");
    expect(update).not.toHaveBeenCalled();
    await user.keyboard("{Enter}");
    expect(update).toHaveBeenCalledWith({ url: "https://other.com/b" });
  });

  it("says when the address is not one, and keeps the old", async () => {
    const { update, user } = open();
    const field = screen.getByRole("textbox", { name: "Address" });
    await user.clear(field);
    await user.type(field, "javascript:alert(1){Enter}");
    expect(screen.getByText(/starting with http/)).toBeInTheDocument();
    expect(update).not.toHaveBeenCalled();
  });
});
