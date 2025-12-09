import {defineConfig} from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./tests/setup.ts"],
    exclude: ["**/node_modules/**", "**/prod_node_modules/**", "**/dist/**"],
    environment: "node",
    testTimeout: 20000,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{js,ts}"],
      exclude: [
        "src/**/*.d.ts",
        "src/**/*.test.{js,ts}",
        "src/types/**",
        "**/node_modules/**",
        "**/prod_node_modules/**",
      ],
    },
  },
});
