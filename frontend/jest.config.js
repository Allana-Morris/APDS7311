module.exports = {
  preset: 'react', // Not strictly necessary, but added for clarity
  testEnvironment: 'jsdom', // Jest uses jsdom for DOM simulation
  transform: {
    '^.+\\.(js|jsx|mjs)$': 'babel-jest', // Use babel-jest for JS, JSX, and MJS files
  },
  extensionsToTreatAsEsm: ['.mjs', '.jsx', '.js'], // Treat these as ES modules
  moduleFileExtensions: ['js', 'mjs', 'jsx', 'json', 'node'], // Recognize these file types
};
