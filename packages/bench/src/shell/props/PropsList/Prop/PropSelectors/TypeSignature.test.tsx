import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TypeSignature, typeParts } from "./TypeSignature";

const kinds = (type: string) => typeParts(type).filter((p) => p.kind !== "space").map((p) => `${p.kind}:${p.text}`);

describe("a type as written", () => {
  it("is cut into literals, names, keywords and punctuation", () => {
    expect(kinds('"sm" | "md"')).toEqual(["string:\"sm\"", "punctuation:|", "string:\"md\""]);
    expect(kinds("BGColors | string")).toEqual(["name:BGColors", "punctuation:|", "keyword:string"]);
  });

  it("keeps a function's parameters, arrow and dotted names", () => {
    expect(kinds("(item: HTMLElement) => void")).toEqual(["punctuation:(", "name:item", "punctuation::", "name:HTMLElement", "punctuation:)", "punctuation:=>", "keyword:void"]);
    expect(kinds("React.ReactNode")).toEqual(["name:React.ReactNode"]);
  });

  it("reads numbers as numbers", () => {
    expect(kinds("1 | 2.5")).toEqual(["number:1", "punctuation:|", "number:2.5"]);
  });

  it("loses nothing: the pieces make the type again", () => {
    const type = 'Record<string, "a" | (x: number) => void> | null';
    expect(typeParts(type).map((p) => p.text).join("")).toBe(type);
  });

  it("is drawn as its text, and says nothing more unless it is given something to say", () => {
    const { container } = render(<TypeSignature type='"a" | "b"' />);
    expect(container.textContent).toBe('"a" | "b"');
    expect(container.firstElementChild).not.toHaveAttribute("title");
    const { container: titled } = render(<TypeSignature type="string" title="Any string" />);
    expect(titled.firstElementChild).toHaveAttribute("title", "Any string");
  });
});
