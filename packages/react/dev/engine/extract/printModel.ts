import type { ComponentModel } from "../Interfaces/ComponentModel/ComponentModel";
import type { TreeElement } from "../Interfaces/ComponentModel/TreeElement";

/** An element of the model written back as JSX. If the model says what was written, this is the source again (bar whitespace). */
export function printElement(element: TreeElement): string {
  const attributes = element.attributes.map((attribute) => {
    if (attribute.kind === "spread") return `{...${attribute.value.source}}`;
    if (attribute.value === undefined) return attribute.name;
    if (typeof attribute.value === "string") return `${attribute.name}="${attribute.value}"`;
    return `${attribute.name}={${attribute.value.source}}`;
  });
  const children = element.children.map((child) =>
    child.kind === "text" ? child.text : child.kind === "expression" ? `{${child.expr.source}}` : printElement(child.element),
  );
  if (element.type.kind === "fragment") return `<>${children.join("")}</>`;
  const tag = element.type.kind === "host" ? element.type.host.tag : element.type.name;
  const open = [tag, ...attributes].join(" ");
  return children.length ? `<${open}>${children.join("")}</${tag}>` : `<${open} />`;
}

/** The outermost elements the model holds: what each return gives, and what hooks and statics are called with. */
export function topElements(model: ComponentModel): TreeElement[] {
  const found: TreeElement[] = [];
  for (const { value } of model.returns) {
    if (value.kind === "element") found.push(value.element);
    else if (value.kind === "expression") found.push(...value.expr.elements);
  }
  for (const hook of model.hooks) for (const argument of hook.arguments) found.push(...argument.elements);
  for (const wrapper of model.wrappers) for (const argument of wrapper.arguments) found.push(...argument.elements);
  for (const item of model.statics) found.push(...item.value.elements);
  return found;
}

/** Whitespace, quote style and comments are not meaning: take them out of both sides before comparing. */
export const normalise = (jsx: string) =>
  jsx
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "")
    .replace(/(^|\n)[ \t]*\/\/[^\n]*/g, "$1")
    .replace(/'/g, '"')
    .replace(/\s+/g, "");

/** Every element the model holds, nested ones included: in children, and inside the expressions of attributes and children. */
export function allElements(model: ComponentModel): TreeElement[] {
  const found: TreeElement[] = [];
  const visit = (element: TreeElement) => {
    found.push(element);
    for (const attribute of element.attributes) if (attribute.kind === "spread" || typeof attribute.value === "object") for (const inner of (attribute.value as { elements: TreeElement[] }).elements) visit(inner);
    for (const child of element.children) {
      if (child.kind === "element") visit(child.element);
      else if (child.kind === "expression") for (const inner of child.expr.elements) visit(inner);
    }
  };
  for (const element of topElements(model)) visit(element);
  return found;
}
