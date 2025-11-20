export default {
  testEnvironment: "node",
  transform: {},
  testMatch: ["**/__tests__/**/*.test.js", "**/?(*.)+(spec|test).js"],
  collectCoverageFrom: ["src/**/*.js", "!src/app.js", "!src/config/db.js"],
  coverageDirectory: "coverage",
  verbose: true,
  testTimeout: 10000,
};
