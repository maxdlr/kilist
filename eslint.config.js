// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

const TEXT_PROPS = "label|placeholder|title|line|message|accessibilityLabel|accessibilityHint";

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    files: ["src/**/*.tsx"],
    rules: {
      "react/jsx-no-literals": [
        "error",
        {
          noStrings: false,
          ignoreProps: true,
          allowedStrings: ["VS", "?", "X", "K", ">", "›", "‹", "·", "→", "←", "…", "×", "+", "-", "–", "/", ":", "%", " "],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: `JSXAttribute[name.name=/^(${TEXT_PROPS})$/] > :matches(Literal, JSXExpressionContainer > Literal, JSXExpressionContainer > TemplateLiteral)`,
          message: "Visible text must come from the copy files so it can be translated.",
        },
      ],
    },
  },
  {
    files: ["src/admin/**", "src/app/admin/**", "src/app/(tabs)/admin.tsx"],
    rules: {
      "react/jsx-no-literals": "off",
      "no-restricted-syntax": "off",
    },
  },
]);
