import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Existing codebase uses `any` heavily; tighten incrementally.
      // Keep as warning so the build doesn't break, but new code is still flagged.
      "@typescript-eslint/no-explicit-any": "warn",
      // Same for unused vars — useful signal, but not a build blocker today.
      "@typescript-eslint/no-unused-vars": "warn",
      // Empty interfaces / object types are common in shadcn templates.
      "@typescript-eslint/no-empty-object-type": "warn",
      // <img> usage on customer menu pages is intentional (dynamic Firebase URLs).
      "@next/next/no-img-element": "warn",
      // React hook deps warnings — useful but noisy in current state.
      "react-hooks/exhaustive-deps": "warn",
      // Literal quotes/apostrophes in JSX render fine in every browser.
      "react/no-unescaped-entities": "warn",
    },
  },
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "build/**",
      "dist/**",
      ".vercel/**",
      ".firebase/**",
      "scratch/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
