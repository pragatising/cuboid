import { render, renderHook, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlatformProvider, usePlatform } from "./usePlatform";

afterEach(() => vi.unstubAllGlobals());

const stub = (platform: string, userAgent = "") => vi.stubGlobal("navigator", { platform, userAgent });
const detected = () => renderHook(() => usePlatform()).result.current;

describe("usePlatform", () => {
  it.each([
    ["MacIntel", "", "apple"],
    ["iPhone", "", "apple"],
    ["", "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)", "apple"],
    ["Win32", "", "windows"],
    ["Linux x86_64", "", "other"],
    ["", "Mozilla/5.0 (Linux; Android 14)", "other"],
  ])("%s %s is %s", (platform, agent, expected) => {
    stub(platform, agent);
    expect(detected()).toBe(expected);
  });

  it("renders the safe default on the server, which cannot detect it", () => {
    function Probe() {
      return <span>{usePlatform()}</span>;
    }
    stub("MacIntel");
    expect(renderToString(<Probe />)).toContain("other");
  });

  it("a PlatformProvider overrides what was detected", () => {
    stub("Linux x86_64");
    function Probe() {
      return <span data-testid="p">{usePlatform()}</span>;
    }
    render(
      <PlatformProvider value="apple">
        <Probe />
      </PlatformProvider>,
    );
    expect(screen.getByTestId("p")).toHaveTextContent("apple");
  });
});
