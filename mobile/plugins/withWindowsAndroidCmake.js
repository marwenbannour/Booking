const { withGradleProperties } = require('expo/config-plugins');

const WINDOWS_CMAKE_VERSION = '3.31.6';

module.exports = function withWindowsAndroidCmake(config) {
  if (process.platform !== 'win32') {
    return config;
  }

  return withGradleProperties(config, (config) => {
    const cmakeProperty = config.modResults.find(
      (property) => property.type === 'property' && property.key === 'android.cmakeVersion',
    );

    if (cmakeProperty) {
      cmakeProperty.value = WINDOWS_CMAKE_VERSION;
    } else {
      config.modResults.push({
        type: 'property',
        key: 'android.cmakeVersion',
        value: WINDOWS_CMAKE_VERSION,
      });
    }

    return config;
  });
};
