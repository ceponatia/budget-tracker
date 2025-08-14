module.exports = {
  extends: ["../../.eslintrc.cjs"],
  rules: {
    // Electron main/preload runs in Node context
    "no-console": ["warn", { allow: ["warn", "error"] }]
  }
};
