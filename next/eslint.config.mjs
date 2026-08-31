import { defineConfig } from "eslint/config";
import nextTypeScript from "eslint-config-next/typescript";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import prettierRecommended from "eslint-plugin-prettier/recommended";

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypeScript,
  prettierRecommended,
]);
