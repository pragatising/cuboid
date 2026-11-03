// Builds Bench's theme, then reads the library the config describes and writes what Bench shows from it: the props, the structure of each component, the status.
// Run: npm run bench:generate (BENCH_CONFIG=path for another library's config)
export {};
await import("./theme");
await import("./components-json.mjs");
await import("./models");
await import("./api");
await import("./status");
