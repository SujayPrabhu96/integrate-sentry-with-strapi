module.exports = () => ({
  sentry: {
    enabled: true,
    config: {
      dsn: process.env.SENTRY_DSN,
      sendMetadata: true,
    },
  },
});
