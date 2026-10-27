import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: { dedupe: ["react", "react-dom"] },
  // Keep CSS-module class names as written (`Divider`, not `_Divider_6ff8w_2`) so tests can assert on them.
  css: { modules: { classNameStrategy: "non-scoped" } },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "dev/**/*.test.{ts,tsx}"],
    // Type-level tests (`*.test-d.ts(x)`, written with `expectTypeOf`). `ignoreSourceErrors` is on because
    // components not yet migrated off the old theme seam still fail `tsc`; only errors in the test-d files count.
    typecheck: {
      enabled: true,
      include: ["src/**/*.test-d.{ts,tsx}"],
      tsconfig: "./tsconfig.test.json",
      ignoreSourceErrors: true,
    },
  },
});
