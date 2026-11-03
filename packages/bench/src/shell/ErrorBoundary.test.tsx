import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "./ErrorBoundary";

afterEach(cleanup);
beforeEach(() => void vi.spyOn(console, "error").mockImplementation(() => undefined));

const Broken = ({ message = "It broke" }: { message?: string }): React.ReactElement => {
  throw new Error(message);
};

describe("the error boundary", () => {
  it("shows what is inside it while nothing throws", () => {
    render(
      <ErrorBoundary>
        <p>All well</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText("All well")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows what threw as an EmptyState: a heading, and the error's own message", () => {
    render(
      <ErrorBoundary heading="This panel could not be drawn">
        <Broken message="Cannot read properties of undefined" />
      </ErrorBoundary>,
    );
    const alert = screen.getByRole("alert");
    expect(alert.getAttribute("data-component")).toBe("EmptyState");
    expect(alert.textContent).toContain("This panel could not be drawn");
    expect(alert.textContent).toContain("Cannot read properties of undefined");
  });

  it("keeps what is beside it: only its own part is replaced", () => {
    render(
      <>
        <p>The rest</p>
        <ErrorBoundary>
          <Broken />
        </ErrorBoundary>
      </>,
    );
    expect(screen.getByText("The rest")).toBeTruthy();
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("is compact in a small place: the message beside the icon, with no heading", () => {
    render(
      <ErrorBoundary layout="compact" heading="Not shown in compact">
        <Broken message="Small place" />
      </ErrorBoundary>,
    );
    expect(screen.getByRole("alert").getAttribute("data-layout")).toBe("compact");
    expect(screen.getByRole("alert").textContent).toContain("Small place");
  });

  it("tries again when what is being looked at changes, and not before", () => {
    let broken = true;
    const Maybe = () => (broken ? <Broken /> : <p>Recovered</p>);
    const { rerender } = render(
      <ErrorBoundary resetKey="a">
        <Maybe />
      </ErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toBeTruthy();
    broken = false;
    rerender(
      <ErrorBoundary resetKey="a">
        <Maybe />
      </ErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toBeTruthy();
    rerender(
      <ErrorBoundary resetKey="b">
        <Maybe />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Recovered")).toBeTruthy();
  });
});
