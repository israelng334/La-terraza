module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
  ],
  testMatch: [
    '**/src/**/*.test.js',
    '**/src/**/*.spec.js',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
  ],
  verbose: true,
  bail: false,
};
