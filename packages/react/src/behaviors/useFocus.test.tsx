import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef, useState } from "react";
import { describe, expect, it } from "vitest";
import { getTabbableElements, isTabbable } from "./tabbable";
import { useFocusReturn } from "./useFocusReturn";
import { useFocusTrap } from "./useFocusTrap";

function Trap({ initialFocus, returnFocus, children }: { initialFocus?: "second"; returnFocus?: boolean; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const second = useRef<HTMLButtonElement>(null);
  useFocusTrap({ enabled: open, containerRef: container, initialFocusRef: initialFocus ? second : undefined, returnFocus });
  return (
    <>
      <button onClick={() => setOpen(true)}>opener</button>
      <button>outside</button>
      {open && (
        <div ref={container} data-testid="dialog">
          {children ?? (
            <>
              <button>first</button>
              <button ref={second}>second</button>
              <button>last</button>
            </>
          )}
          <button onClick={() => setOpen(false)}>close</button>
        </div>
      )}
    </>
  );
}

const open = () => userEvent.click(screen.getByRole("button", { name: "opener" }));

describe("tabbable", () => {
  it("finds what Tab reaches, in order, and skips what it cannot", () => {
    const { container } = render(
      <div>
        <button>a</button>
        <button disabled>disabled</button>
        <a href="/x">link</a>
        <a>no href</a>
        <input />
        <input type="hidden" />
        <div tabIndex={0}>div</div>
        <div tabIndex={-1}>not tabbable</div>
        <span hidden><button>hidden</button></span>
        <div style={{ display: "none" }}><button>none</button></div>
        <div style={{ visibility: "hidden" }}><button>invisible</button></div>
      </div>,
    );
    expect(getTabbableElements(container).map((el) => el.textContent || el.tagName.toLowerCase())).toEqual(["a", "link", "input", "div"]);
  });

  it("isTabbable agrees for a single element", () => {
    const { getByText } = render(<><button>ok</button><button disabled>no</button></>);
    expect(isTabbable(getByText("ok"))).toBe(true);
    expect(isTabbable(getByText("no"))).toBe(false);
  });
});

describe("useFocusTrap", () => {
  it("moves focus into the layer when it turns on", async () => {
    render(<Trap />);
    await open();
    expect(screen.getByRole("button", { name: "first" })).toHaveFocus();
  });

  it("focuses initialFocusRef when given one", async () => {
    render(<Trap initialFocus="second" />);
    await open();
    expect(screen.getByRole("button", { name: "second" })).toHaveFocus();
  });

  it("focuses the container itself when it holds nothing tabbable, so Tab has somewhere to start", async () => {
    function Empty() {
      const [open, setOpen] = useState(false);
      const container = useRef<HTMLDivElement>(null);
      useFocusTrap({ enabled: open, containerRef: container });
      return (
        <>
          <button onClick={() => setOpen(true)}>opener</button>
          {open && <div ref={container} data-testid="dialog">only text</div>}
        </>
      );
    }
    render(<Empty />);
    await userEvent.click(screen.getByRole("button", { name: "opener" }));
    expect(screen.getByTestId("dialog")).toHaveFocus();
    expect(screen.getByTestId("dialog")).toHaveAttribute("tabindex", "-1");
  });

  it("wraps Tab from the last element to the first, and Shift+Tab back", async () => {
    render(<Trap />);
    await open();
    screen.getByRole("button", { name: "close" }).focus();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "first" })).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(screen.getByRole("button", { name: "close" })).toHaveFocus();
  });

  it("Tab keeps moving normally in the middle", async () => {
    render(<Trap />);
    await open();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "second" })).toHaveFocus();
  });

  it("pulls focus back when it lands outside the layer", async () => {
    render(<Trap />);
    await open();
    screen.getByRole("button", { name: "outside" }).focus();
    expect(screen.getByRole("button", { name: "first" })).toHaveFocus();
  });

  it("gives focus back to the opener when it turns off", async () => {
    render(<Trap />);
    await open();
    await userEvent.click(screen.getByRole("button", { name: "close" }));
    expect(screen.getByRole("button", { name: "opener" })).toHaveFocus();
  });

  it("leaves focus alone on close when returnFocus is false", async () => {
    render(<Trap returnFocus={false} />);
    await open();
    await userEvent.click(screen.getByRole("button", { name: "close" }));
    expect(screen.getByRole("button", { name: "opener" })).not.toHaveFocus();
  });

  it("does nothing while off", async () => {
    render(<Trap />);
    screen.getByRole("button", { name: "outside" }).focus();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "outside" })).not.toHaveFocus();
  });
});

describe("useFocusReturn", () => {
  function Return() {
    const [on, setOn] = useState(false);
    const box = useRef<HTMLDivElement>(null);
    useFocusReturn({ enabled: on, containerRef: box });
    return (
      <>
        <button onClick={() => setOn(true)}>opener</button>
        <button>elsewhere</button>
        {on && (
          <div ref={box}>
            <button autoFocus onClick={() => setOn(false)}>inside</button>
          </div>
        )}
      </>
    );
  }

  it("returns focus to the opener when the layer closes with focus still inside it", async () => {
    render(<Return />);
    await userEvent.click(screen.getByRole("button", { name: "opener" }));
    await userEvent.click(screen.getByRole("button", { name: "inside" }));
    expect(screen.getByRole("button", { name: "opener" })).toHaveFocus();
  });

  it("does not steal focus the user already moved elsewhere on purpose", async () => {
    function Elsewhere() {
      const [on, setOn] = useState(true);
      useFocusReturn({ enabled: on });
      return (
        <>
          <button onClick={() => setOn(false)}>close</button>
          <button>other</button>
        </>
      );
    }
    render(<Elsewhere />);
    screen.getByRole("button", { name: "other" }).focus();
    await userEvent.click(screen.getByRole("button", { name: "close" }));
    expect(screen.getByRole("button", { name: "close" })).toHaveFocus();
  });

  it("returns focus on unmount", async () => {
    function Host({ show }: { show: boolean }) {
      return (
        <>
          <button>opener</button>
          {show && <Layer />}
        </>
      );
    }
    function Layer() {
      useFocusReturn({ enabled: true });
      return <button autoFocus>layer</button>;
    }
    const { rerender } = render(<Host show={false} />);
    screen.getByRole("button", { name: "opener" }).focus();
    rerender(<Host show />);
    expect(screen.getByRole("button", { name: "layer" })).toHaveFocus();
    rerender(<Host show={false} />);
    expect(screen.getByRole("button", { name: "opener" })).toHaveFocus();
  });
});
