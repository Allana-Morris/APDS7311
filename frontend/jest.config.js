module.exports = {
  transform: {
    '^.+\\.mjs$': 'babel-jest', // Ensures Jest transforms .mjs files with Babel
  },
  moduleFileExtensions: ['js', 'jsx', 'mjs', 'json', 'node'], // Recognizes .mjs files as module extensions
  testEnvironment: 'jsdom', // Use jsdom for testing DOM-like environments
  testMatch: [
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,mjs,ts,tsx}', // Ensure src files are included in tests
    '<rootDir>/tests/**/*.{test,spec}.{js,jsx,mjs,ts,tsx}', // Added tests folder here
  ],
  testPathIgnorePatterns: ['\\\\node_modules\\\\'], // Ignore node_modules during tests
};
