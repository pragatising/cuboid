/**
 * One shared error type for "a token's value/shape didn't match what a
 * transformer expected" — thrown with the token's path so a failure points
 * at the exact bad token instead of a generic stack trace. Replaces the
 * ~159 scattered `console.error(...); process.exit(1)` pairs in the old
 * scripts/build-theme.mjs (the actual bug this migration started from —
 * see docs/token-architecture-migration.md §1).
 *
 * Not yet implemented — stub only.
 */
export class InvalidTokenError extends Error {}
