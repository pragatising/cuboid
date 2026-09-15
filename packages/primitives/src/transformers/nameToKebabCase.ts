/**
 * Token path segments -> one kebab-case CSS custom property name, preserving
 * inner camelCase word boundaries (e.g. ["button", "bgColor"] ->
 * "cube-button-bg-color", not "cube-button-bgcolor").
 */
export function nameToKebabCase(path: string[]): string {
  return `cube-${path
    .join("-")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()}`;
}
