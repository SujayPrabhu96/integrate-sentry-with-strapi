const Sentry = require("@sentry/node");
const {
  extractTraceparentData,
  Span,
  stripUrlQueryAndFragment,
} = require("@sentry/tracing");

// https://docs.sentry.io/platforms/node/guides/koa/
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: strapi.config.environment,
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
  ],
  tracesSampleRate: 1.0,
});

const tracingMiddleWare = async (ctx) => {
  const reqMethod = (ctx.method || "").toUpperCase();
  const reqUrl = ctx.url && stripUrlQueryAndFragment(ctx.url);

  // connect to trace of upstream app
  let traceparentData;
  if (ctx.request.get("sentry-trace")) {
    traceparentData = extractTraceparentData(ctx.request.get("sentry-trace"));
  }

  const transaction = Sentry.startTransaction({
    name: `${reqMethod} ${reqUrl}`,
    op: "http.server",
    ...traceparentData,
  });

  ctx.__sentry_transaction = transaction;

  Sentry.getCurrentHub().configureScope((scope) => {
    scope.setSpan(transaction);
  });

  ctx.res.on("finish", () => {
    setImmediate(() => {
      if (ctx._matchedRoute) {
        const mountPath = ctx.mountPath || "";
        transaction.setName(`${reqMethod} ${mountPath}${ctx._matchedRoute}`);
      }
      transaction.setHttpStatus(ctx.status);
      transaction.finish();
    });
  });
};

module.exports = () => {
  return async (ctx, next) => {
    try {
      await tracingMiddleWare(ctx);
      await next();
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  };
};
