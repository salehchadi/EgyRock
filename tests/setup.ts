import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

/**
 * Vitest runs without `globals: true`, so React Testing Library cannot register
 * its own automatic cleanup. Do it once here for every component suite.
 */
afterEach(() => {
  cleanup();
});
