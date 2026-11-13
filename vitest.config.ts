import path from "path";
import { defineConfig } from "vitest/config";

const requireContext = {
  name: "require-context",
  transform: (code: string) =>
    code.includes("require.context(")
      ? code.replace(
          /require\.context\("([^"]+)",\s*false,\s*\/\\\.ts\$\/\)/g,
          '((files) => Object.assign((key) => files[key], { keys: () => Object.keys(files) }))(import.meta.glob("$1/*.ts", { eager: true }))',
        )
      : null,
};

export default defineConfig({
  plugins: [requireContext],
  test: {
    setupFiles: ["./src/offline/__tests__/setup.ts"],
    include: [
      "src/offline/__tests__/**/*.test.ts",
      "src/skins/__tests__/**/*.test.ts",
      "src/notifications/__tests__/**/*.test.ts",
    ],
  },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
