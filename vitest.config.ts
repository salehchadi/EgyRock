import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  // React Testing Library suites are plain renders, so no JSX transform plugin is
  // needed — esbuild compiles the .tsx files using tsconfig's `jsx: react-jsx`.
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
    },
  },
  test: {
    // jsdom is required for the cart provider tests (localStorage + window events).
    environment: "jsdom",
    // Only pick up Vitest-owned files. Playwright specs live in tests/e2e and must
    // never be collected here (they would fail with "test() called outside a runner").
    include: ["tests/unit/**/*.test.{ts,tsx}", "tests/integration/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/setup.ts"],
    restoreMocks: true,
    // The default `threads` pool intermittently crashes on teardown under Node 22
    // on Windows ("Failed to terminate worker"), which makes `npm test` exit 1
    // even when every assertion passed. Child processes shut down reliably.
    pool: "forks",
  },
});
