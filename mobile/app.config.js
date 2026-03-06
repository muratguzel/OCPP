const base = require('./app.json');

module.exports = {
  ...base.expo,
  experiments: {
    ...(base.expo.experiments || {}),
    ...(process.env.WEB_BASE_URL ? { baseUrl: process.env.WEB_BASE_URL } : {}),
  },
  extra: {
    ...(base.expo.extra || {}),
    eas: {
      ...((base.expo.extra && base.expo.extra.eas) || {}),
      projectId: "ec0517a0-cdf6-469a-a0e3-9eed0549c66a",
    },
  },
};
