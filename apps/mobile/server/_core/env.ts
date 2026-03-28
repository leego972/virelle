export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  ownerName: process.env.OWNER_NAME ?? "",
  isProduction: process.env.NODE_ENV === "production",
  isStaging: process.env.NODE_ENV === "staging",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",

  // ─── Stripe (same keys as web — mobile redirects to web checkout) ──────────
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",

  // ─── Stripe price IDs — Indie tier ────────────────────────────────────────
  stripeIndieMonthlyPriceId: process.env.STRIPE_INDIE_MONTHLY_PRICE_ID ?? "",
  stripeIndieAnnualPriceId: process.env.STRIPE_INDIE_ANNUAL_PRICE_ID ?? "",

  // ─── Stripe price IDs — Creator tier ─────────────────────────────────────
  stripeCreatorMonthlyPriceId: process.env.STRIPE_CREATOR_MONTHLY_PRICE_ID ?? "",
  stripeCreatorAnnualPriceId: process.env.STRIPE_CREATOR_ANNUAL_PRICE_ID ?? "",

  // ─── Stripe price IDs — Studio tier ──────────────────────────────────────
  stripeStudioMonthlyPriceId: process.env.STRIPE_STUDIO_MONTHLY_PRICE_ID ?? "",
  stripeStudioAnnualPriceId: process.env.STRIPE_STUDIO_ANNUAL_PRICE_ID ?? "",

  // ─── Stripe price IDs — Credit top-up packs ──────────────────────────────
  stripeTopUp10PriceId: process.env.STRIPE_TOPUP_10_PRICE_ID ?? "",
  stripeTopUp30PriceId: process.env.STRIPE_TOPUP_30_PRICE_ID ?? "",
  stripeTopUp100PriceId: process.env.STRIPE_TOPUP_100_PRICE_ID ?? "",
  stripeTopUp200PriceId: process.env.STRIPE_TOPUP_200_PRICE_ID ?? "",
  stripeTopUp500PriceId: process.env.STRIPE_TOPUP_500_PRICE_ID ?? "",
  stripeTopUp1000PriceId: process.env.STRIPE_TOPUP_1000_PRICE_ID ?? "",

  // ─── AI Services ──────────────────────────────────────────────────────────
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  runwayApiKey: process.env.RUNWAYML_API_SECRET || process.env.RUNWAY_API_KEY || "",
  pollinationsApiKey: process.env.POLLINATIONS_API_KEY || "sk_KZ0EBVOHXycDd8YnvEZAvLDGnvhK33SP",
  googleApiKey: process.env.GOOGLE_API_KEY ?? "",
  huggingFaceApiKey: process.env.HUGGING_FACE_API_KEY ?? "",

  // ─── Email ─────────────────────────────────────────────────────────────────
  resendApiKey: process.env.RESEND_API_KEY ?? "",

  // ─── Sentry ────────────────────────────────────────────────────────────────
  sentryDsn: process.env.SENTRY_DSN ?? "",
};
