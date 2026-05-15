const readEnv = (...names: string[]) =>
  names.map((name) => process.env[name]?.trim()).find(Boolean) ?? "";

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
  get openaiApiKey()    { return readEnv("OPENAI_API_KEY"); },
  get replicateApiKey() { return readEnv("REPLICATE_API_KEY"); },
  get falApiKey()       { return readEnv("FAL_API_KEY"); },
  get togetherApiKey()  { return readEnv("TOGETHER_API_KEY"); },
  get claudeApiKey()    { return readEnv("ANTHROPIC_API_KEY", "CLAUDE_API_KEY"); },
  get geminiApiKey()    { return readEnv("GEMINI_API_KEY", "GOOGLE_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY"); },
  get groqApiKey()      { return readEnv("GROQ_API_KEY"); },
  get mistralApiKey()   { return readEnv("MISTRAL_API_KEY"); },
};
