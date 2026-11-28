import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/components/**/*.{ts,tsx}", "src/actions/**/*.{ts,tsx}"],
    ignores: ["**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[object.name='USER_ROLES'][property.name='ADMIN']",
          message:
            "Do not gate UI or Server Actions on USER_ROLES.ADMIN; check atomic PERMISSIONS via hasPermission() instead.",
        },
        {
          selector: "MemberExpression[object.property.name='app_metadata'][property.name='user_role']",
          message:
            "Do not read JWT app_metadata.user_role; resolve roles and permissions from the database.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    ".vercel/**",
    ".worktrees/**",
    "coverage/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
