/**
 * Sentry Server-Side Initialisation
 * Import this at the very top of server/_core/index.ts (before all other imports).
 * Set SENTRY_DSN in your environment variables to enable error reporting.
 */
import * as Sentry from "@sentry/node";
import type { ErrorEvent, EventHint } from "@sentry/node";

const dsn = process.env.SENTRY_DSN;
const env = process.env.NODE_ENV ?? "development";

if (dsn) {
  Sentry.init({
    dsn,
    environment: env,
    tracesSampleRate: env === "production" ? 0.1 : 1.0,
    sampleRate: 1.0,
    integrations: [
      Sentry.httpIntegration(),
      Sentry.expressIntegration(),
    ],
    beforeSend(event: ErrorEvent, _hint: EventHint): ErrorEvent | null {
      // Strip sensitive fields from request data
      if (event.request?.cookies) delete event.request.cookies;
      if (event.request?.headers) {
        const h = event.request.headers as Record<string, unknown>;
        delete h.authorization;
        delete h.cookie;
      }
      return event;
    },
  });
  console.log(`[Sentry] Initialised for environment: ${env}`);
} else {
  console.log("[Sentry] SENTRY_DSN not set — error reporting disabled");
}

export { Sentry };
