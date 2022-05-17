const Sentry = require("@sentry/node");
const {
  extractTraceparentData,
  Span,
  stripUrlQueryAndFragment,
} = require("@sentry/tracing");

//https://docs.sentry.io/platforms/node/guides/koa/
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: strapi.config.environment,
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
  ],
  tracesSampleRate: 1.0,
});

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    try {
      await next();
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  };
};
