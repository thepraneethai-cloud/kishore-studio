export const ENV = {
  appId: process.env.VITE_APP_ID ?? "kishore-studio",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  disableAuth: process.env.DISABLE_AUTH === "true",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Cloudflare R2
  r2AccountId: process.env.R2_ACCOUNT_ID ?? "",
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  r2BucketName: process.env.R2_BUCKET_NAME ?? "",
  r2PublicUrl: process.env.R2_PUBLIC_URL ?? "",
  // ── API Keys ──────────────────────────────────────────────────────────
  // Set these in Railway → Variables. They take priority over DB settings.
  // Never hard-coded here — always read from the environment at runtime.
  openaiApiKey:    process.env.OPENAI_API_KEY    ?? "",
  replicateApiKey: process.env.REPLICATE_API_KEY ?? "",
  falApiKey:       process.env.FAL_API_KEY       ?? "",
  togetherApiKey:  process.env.TOGETHER_API_KEY  ?? "",
  claudeApiKey:    process.env.ANTHROPIC_API_KEY ?? "",
  geminiApiKey:    process.env.GEMINI_API_KEY    ?? "",
  groqApiKey:      process.env.GROQ_API_KEY      ?? "",
  mistralApiKey:   process.env.MISTRAL_API_KEY   ?? "",
};
