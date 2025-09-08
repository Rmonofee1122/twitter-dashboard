// eslint.config.mjs
import next from "eslint-config-next";

export default [
  ...next,
  {
    // 共通で厳しすぎるルールを一時的に弱める
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "prefer-const": "warn",
      "react/no-unescaped-entities": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "@next/next/no-img-element": "off",
    },
  },
  {
    // API/Trigger のように型が揺れやすい領域は一時的に any 許容
    files: ["src/app/api/**", "src/trigger/**", "src/utils/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    // pages や charts で一時的に any を許容（段階的に戻す）
    files: ["src/components/**/charts/**", "src/components/trends/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
