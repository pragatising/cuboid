/**
 * The shape every leaf in tokens/ must satisfy. This is the contract the
 * whole pipeline hinges on: every schema validates against it, every
 * transformer consumes it, every format walks a tree of it. See
 * DESIGN.md §1 for the five $type values this token set actually uses.
 *
 * Not yet implemented — stub only.
 */
export type DesignToken = unknown; // TODO: { $value: unknown; $type: TokenType; $description?: string }
