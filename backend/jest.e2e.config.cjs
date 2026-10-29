const baseConfig = require('./jest.config.cjs');

module.exports = {
  ...baseConfig,
  testRegex: '.e2e-spec\\.ts$',
  collectCoverage: false,
};
