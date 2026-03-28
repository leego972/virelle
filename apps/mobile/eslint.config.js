// https://docs.expo.dev/guides/using-eslint/
import { defineConfig } from "eslint/config";
import expoConfig from "eslint-config-expo/flat.js";

export default defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    rules: {
      // Downgrade to warning — unescaped entities are cosmetic and should not block CI
      "react/no-unescaped-entities": "warn",
    },
  },
]);
