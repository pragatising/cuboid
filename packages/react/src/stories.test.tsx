import { cleanup, render } from "@testing-library/react";
import { composeStories } from "@storybook/react";
import type { Meta } from "@storybook/react";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Smoke test: every story of every component renders without throwing and without React warnings (invalid DOM
 * nesting, unknown props, missing keys). It does not judge how a story looks: that is the Storybook review.
 */
const modules = import.meta.glob<{ default: Meta }>("./components/**/*.stories.tsx", { eager: true });

afterEach(cleanup);

describe.each(Object.entries(modules))("%s", (path, module) => {
  const stories = composeStories(module as never) as Record<string, React.ComponentType>;

  it.each(Object.entries(stories))("%s renders", (_name, Story) => {
    const errors: string[] = [];
    const spy = vi.spyOn(console, "error").mockImplementation((...args) => {
      errors.push(args.map(String).join(" "));
    });
    try {
      render(<Story />);
    } finally {
      spy.mockRestore();
    }
    expect(errors, path).toEqual([]);
  });
});
