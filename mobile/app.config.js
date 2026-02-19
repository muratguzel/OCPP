const base = require('./app.json');

module.exports = {
  ...base.expo,
  experiments: {
    ...(base.expo.experiments || {}),
    ...(process.env.WEB_BASE_URL ? { baseUrl: process.env.WEB_BASE_URL } : {}),
  },
};
