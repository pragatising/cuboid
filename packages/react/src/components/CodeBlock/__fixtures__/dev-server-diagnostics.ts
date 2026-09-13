/**
 * Fictional dev-server diagnostics snapshot — package manifest, Vite output,
 * TypeScript config, and ESLint results. All package names and versions are
 * illustrative.
 */
const devServerDiagnostics = {
  project: {
    name: "@acme/design-system",
    version: "2.4.1",
    private: true,
    type: "module",
    repository: "https://github.com/acme/design-system",
    license: "MIT",
    engines: {
      node: ">=20.11.0",
      npm: ">=10.0.0",
    },
  },
  scripts: {
    dev: "vite",
    build: "tsc -b && vite build",
    preview: "vite preview",
    lint: "eslint . --max-warnings 0",
    "test:unit": "vitest run",
    "storybook": "storybook dev -p 6006",
  },
  devServer: {
    host: "localhost",
    port: 5173,
    https: false,
    open: true,
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 5173,
      overlay: true,
    },
    config: {
      root: "./",
      base: "/",
      resolve: {
        alias: {
          "@": "/src",
          "@theme": "/src/theme",
        },
      },
      server: {
        cors: true,
        strictPort: false,
      },
    },
  },
  build: {
    tool: "vite",
    duration_ms: 1842,
    mode: "development",
    sourcemap: true,
    chunks: [
      {
        file: "assets/index-a3f91c2b.js",
        size_kb: 412.8,
        modules: 184,
        isEntry: true,
      },
      {
        file: "assets/vendor-react-8e02d1f4.js",
        size_kb: 138.2,
        modules: 42,
        isEntry: false,
      },
      {
        file: "assets/theme-tokens-f04b9e11.css",
        size_kb: 24.6,
        modules: 1,
        isEntry: false,
      },
    ],
    warnings: [
      "chunk size exceeds 500 kB after minification",
      "dynamic import() not analyzed at build time",
    ],
  },
  dependencies: {
    react: "^19.0.0",
    "react-dom": "^19.0.0",
    clsx: "^2.1.1",
  },
  devDependencies: {
    vite: "^6.2.0",
    typescript: "^5.8.2",
    vitest: "^3.0.8",
    eslint: "^9.22.0",
    "@storybook/react-vite": "^8.6.4",
    "@types/react": "^19.0.10",
  },
  typescript: {
    version: "5.8.2",
    strict: true,
    compilerOptions: {
      target: "ES2022",
      module: "ESNext",
      moduleResolution: "bundler",
      jsx: "react-jsx",
      noEmit: true,
      skipLibCheck: true,
      paths: {
        "@/*": ["./src/*"],
        "@theme/*": ["./src/theme/*"],
      },
    },
    diagnostics: {
      errors: 0,
      warnings: 2,
      files_checked: 148,
    },
  },
  eslint: {
    version: "9.22.0",
    config: "flat",
    results: [
      {
        file: "src/components/CodeBlock/tokenizer.ts",
        messages: [
          {
            ruleId: "@typescript-eslint/no-unused-vars",
            severity: 1,
            message: "'depth' is defined but never used.",
            line: 87,
            column: 3,
          },
        ],
        errorCount: 0,
        warningCount: 1,
      },
      {
        file: "src/theme/build-theme.mjs",
        messages: [],
        errorCount: 0,
        warningCount: 0,
      },
    ],
    summary: {
      errorCount: 0,
      warningCount: 2,
      fixableWarningCount: 1,
    },
  },
  vitest: {
    version: "3.0.8",
    environment: "jsdom",
    lastRun: "2026-06-14T09:41:22.318Z",
    duration_ms: 4120,
    suites: 12,
    tests: 87,
    passed: 85,
    failed: 0,
    skipped: 2,
    coverage: {
      lines: 78.4,
      branches: 71.2,
      functions: 82.9,
      statements: 77.8,
    },
  },
  env: {
    NODE_ENV: "development",
    VITE_API_BASE_URL: "http://localhost:3000",
    VITE_ENABLE_MOCKS: "true",
    CI: null,
  },
};

export default devServerDiagnostics;
