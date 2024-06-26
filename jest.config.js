/**
 * List of modules from node_modules that should be transpiled
 */
const EXCLUDES_LIST = []

module.exports = {
  roots: ['<rootDir>/src/'],
  transform: {
    '^.+\\.(j|t)s(x?)$': ['@swc/jest', { jsc: { parser: { syntax: 'typescript', decorators: true } } }],
  },
  transformIgnorePatterns: [`/node_modules/(?!(${EXCLUDES_LIST.join('|')})/)`],
  testMatch: null,
  testRegex: '(\\.|/)(test|spec)\\.(j|t)s(x?)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '@app/(.*)': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  coverageProvider: 'v8',
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx,mjs}'],
  coveragePathIgnorePatterns: ['polygon', 'Polygon'],
}
