import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../../../test/testing";
import { InputText } from "../InputText";

describe("InputField: label help", () => {
  it("is a button by the label, named for the field, that explains it in a tooltip on keyboard focus", async () => {
    render(<InputText label="Name" labelHelp="As it appears on your ID" />);
    const help = screen.getByRole("button", { name: "More about Name" });
    expect(help).toBeInTheDocument();
    // The help button is in the label row, above the field, so it comes first in the tab order.
    await userEvent.tab();
    expect(help).toHaveFocus();
    expect(help).toHaveAccessibleDescription("As it appears on your ID");
    await userEvent.tab();
    expect(screen.getByLabelText("Name")).toHaveFocus();
  });

  it("is not there without labelHelp or without a label", () => {
    const { rerender } = render(<InputText label="Name" />);
    expect(screen.queryByRole("button")).toBeNull();
    rerender(<InputText aria-label="Name" labelHelp="Help" />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("InputField: help and error visuals", () => {
  it("renders the help visual before the help text, hidden from assistive technology, outside the description", () => {
    render(<InputText label="A" description="Help" descriptionVisual={<svg data-testid="help-visual" />} />);
    expect(screen.getByTestId("help-visual").parentElement).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByLabelText("A")).toHaveAccessibleDescription("Help");
  });

  it("renders the error visual before the error, and only with an error", () => {
    const { rerender } = render(<InputText label="A" errorVisual={<svg data-testid="error-visual" />} />);
    expect(screen.queryByTestId("error-visual")).toBeNull();
    rerender(<InputText label="A" error="Required" errorVisual={<svg data-testid="error-visual" />} />);
    expect(screen.getByTestId("error-visual").parentElement).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByLabelText("A")).toHaveAccessibleDescription("Required");
  });
});

describe("InputField: accessibility", () => {
  it("has no axe violations with every slot filled", async () => {
    const { container } = render(
      <InputText label="Name" labelHelp="Help" description="Help text" descriptionVisual={<svg />} error="Required" errorVisual={<svg />} showCount maxLength={20} />,
    );
    await expectNoAxeViolations(container);
  });
});
