import { useState, useEffect } from "react";
import { Eye, EyeOff, Save, ArrowLeft, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Settings() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"api-keys" | "providers" | "budget">("api-keys");
  const [apiKeys, setApiKeys] = useState({
    openaiApiKey: "",
    claudeApiKey: "",
    geminiApiKey: "",
    replicateApiKey: "",
    groqApiKey: "",
    mistralApiKey: "",
    falApiKey: "",
    togetherApiKey: "",
  });
  const [showKeys, setShowKeys] = useState({
    openaiApiKey: false,
    claudeApiKey: false,
    geminiApiKey: false,
    replicateApiKey: false,
    groqApiKey: false,
    mistralApiKey: false,
    falApiKey: false,
    togetherApiKey: false,
  });
  const [providers, setProviders] = useState({
    lyricsProvider: "chatgpt",
    imageProvider: "flux",
    videoProvider: "runway",
    llmModel: "gemini-2.5-flash",
  });
  const [budget, setBudget] = useState({
    monthlyBudgetUSD: 50,
    budgetResetDay: 1,
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch existing settings
  const { data: settings, isLoading: settingsLoading } = trpc.settings.getSettings.useQuery(undefined, {
    enabled: isAuthenticated && !authLoading,
  });

  // Load settings into form when they arrive
  useEffect(() => {
    if (settings) {
      setApiKeys({
        openaiApiKey: settings.openaiApiKey || "",
        claudeApiKey: settings.claudeApiKey || "",
        geminiApiKey: settings.geminiApiKey || "",
        replicateApiKey: settings.replicateApiKey || "",
        groqApiKey: settings.groqApiKey || "",
        mistralApiKey: settings.mistralApiKey || "",
        falApiKey: (settings as any).falApiKey || "",
        togetherApiKey: (settings as any).togetherApiKey || "",
      });
      setProviders({
        lyricsProvider: (settings.lyricsProvider as any) || "chatgpt",
        imageProvider: (settings.imageProvider as any) || "flux",
        videoProvider: (settings.videoProvider as any) || "runway",
        llmModel: settings.llmModel || "gemini-2.5-flash",
      });
      setBudget({
        monthlyBudgetUSD: Number(settings.monthlyBudgetUSD) || 50,
        budgetResetDay: settings.budgetResetDay || 1,
      });
    }
  }, [settings]);

  // tRPC mutations
  const saveApiKeysMutation = trpc.settings.saveApiKeys.useMutation();
  const saveProvidersMutation = trpc.settings.saveProviders.useMutation();
  const saveBudgetMutation = trpc.settings.saveBudget.useMutation();

  const handleSaveApiKeys = async () => {
    setSaving(true);
    try {
      await saveApiKeysMutation.mutateAsync(apiKeys);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Failed to save API keys:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProviders = async () => {
    setSaving(true);
    try {
      await saveProvidersMutation.mutateAsync({
        lyricsProvider: providers.lyricsProvider as "chatgpt" | "claude" | "gemini",
        imageProvider: providers.imageProvider as "flux" | "dalle" | "midjourney",
        videoProvider: providers.videoProvider as "runway" | "grok" | "pika",
        llmModel: providers.llmModel,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Failed to save providers:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBudget = async () => {
    setSaving(true);
    try {
      await saveBudgetMutation.mutateAsync(budget);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Failed to save budget:", error);
    } finally {
      setSaving(false);
    }
  };

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    navigate("/");
    return null;
  }

  if (authLoading || settingsLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0a0a14 0%, #1a1a2e 50%, #16213e 100%)",
          backgroundAttachment: "fixed",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Loader2 size={32} style={{ color: "#00d4ff", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0a14 0%, #1a1a2e 50%, #16213e 100%)", backgroundAttachment: "fixed", padding: "2rem" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Header with Back Button */}
        <div style={{ marginBottom: "2rem" }}>
          <button
            onClick={() => navigate("/")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "none",
              border: "none",
              color: "#00d4ff",
              cursor: "pointer",
              fontSize: "0.875rem",
              marginBottom: "1rem",
              padding: "0.5rem",
              borderRadius: "0.5rem",
              transition: "all 200ms",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0, 212, 255, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
            }}
          >
            <ArrowLeft size={18} />
            Back
          </button>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: "700",
              color: "#00d4ff",
              fontFamily: "'Space Grotesk', sans-serif",
              marginBottom: "0.5rem",
            }}
          >
            Settings
          </h1>
          <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "0.875rem" }}>
            Manage your API keys, AI providers, and budget limits
          </p>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            marginBottom: "2rem",
            borderBottom: "1px solid rgba(0, 212, 255, 0.2)",
          }}
        >
          {(["api-keys", "providers", "budget"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "0.75rem 1rem",
                background: "none",
                border: "none",
                color: activeTab === tab ? "#00d4ff" : "rgba(255, 255, 255, 0.6)",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: activeTab === tab ? "600" : "400",
                borderBottom: activeTab === tab ? "2px solid #00d4ff" : "none",
                transition: "all 200ms",
                textTransform: "capitalize",
              }}
            >
              {tab.replace("-", " ")}
            </button>
          ))}
        </div>

        {/* Success Message */}
        {saved && (
          <div
            style={{
              padding: "1rem",
              marginBottom: "1.5rem",
              background: "rgba(57, 255, 20, 0.1)",
              border: "1px solid #39ff14",
              borderRadius: "0.5rem",
              color: "#39ff14",
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            ✓ Settings saved successfully!
          </div>
        )}

        {/* API Keys Tab */}
        {activeTab === "api-keys" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {(["falApiKey", "togetherApiKey", "openaiApiKey", "claudeApiKey", "geminiApiKey", "replicateApiKey", "groqApiKey", "mistralApiKey"] as const).map((key) => {
              const meta: Record<string, { label: string; hint: string; placeholder: string; badge?: string }> = {
                falApiKey: {
                  label: "fal.ai API Key",
                  hint: "Free credits on signup. Powers FLUX image generation (~$0.003/image) and Wan2.1 / Kling video generation (~$0.025/clip). Get yours at fal.ai/dashboard/keys",
                  placeholder: "...",
                  badge: "FREE credits",
                },
                togetherApiKey: {
                  label: "Together AI API Key",
                  hint: "Free tier includes FLUX.1-schnell-Free for image generation at no cost. Get yours at api.together.ai",
                  placeholder: "...",
                  badge: "FREE tier",
                },
                openaiApiKey: {
                  label: "OpenAI API Key",
                  hint: "Powers GPT-4o lyrics + DALL-E 3 / GPT-image-1 image generation. Get yours at platform.openai.com/api-keys",
                  placeholder: "sk-...",
                },
                claudeApiKey: {
                  label: "Claude API Key (Anthropic)",
                  hint: "Powers Claude 3.5 Haiku lyrics generation — fast and high quality. Get yours at console.anthropic.com",
                  placeholder: "sk-ant-...",
                },
                geminiApiKey: {
                  label: "Gemini API Key (Google)",
                  hint: "Powers AI lyrics, scene analysis, and Director Agent with your own quota. Get yours at aistudio.google.com/apikey",
                  placeholder: "AIza...",
                },
                replicateApiKey: {
                  label: "Replicate API Key",
                  hint: "Powers Flux Dev / Schnell image generation and MiniMax video generation. Get yours at replicate.com/account/api-tokens",
                  placeholder: "r8_...",
                },
                groqApiKey: {
                  label: "Groq API Key",
                  hint: "Powers Llama 3.1 8B and Qwen 2.5 lyrics — extremely fast and free tier available. Get yours at console.groq.com",
                  placeholder: "gsk_...",
                  badge: "FREE tier",
                },
                mistralApiKey: {
                  label: "Mistral API Key",
                  hint: "Powers Mistral Small lyrics — great multilingual quality. Get yours at console.mistral.ai",
                  placeholder: "...",
                  badge: "FREE tier",
                },
              };
              const { label, hint, placeholder, badge } = meta[key];
              return (
              <div key={key}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem", fontSize: "0.875rem", fontWeight: "600", color: "#ececf1" }}>
                  {label}
                  {badge && (
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.1rem 0.45rem", borderRadius: "999px", background: "rgba(16,163,127,0.15)", color: "#10a37f", border: "1px solid rgba(16,163,127,0.35)" }}>
                      {badge}
                    </span>
                  )}
                </label>
                <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", marginBottom: "0.5rem" }}>
                  {hint}
                </p>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type={showKeys[key] ? "text" : "password"}
                    value={apiKeys[key]}
                    onChange={(e) => setApiKeys({ ...apiKeys, [key]: e.target.value })}
                    placeholder={placeholder}
                    style={{
                      flex: 1,
                      padding: "0.75rem",
                      background: "rgba(0, 212, 255, 0.05)",
                      border: "1px solid rgba(0, 212, 255, 0.2)",
                      borderRadius: "0.5rem",
                      color: "#fff",
                      fontSize: "0.875rem",
                    }}
                  />
                  <button
                    onClick={() => setShowKeys({ ...showKeys, [key]: !showKeys[key] })}
                    style={{
                      padding: "0.75rem",
                      background: "rgba(0, 212, 255, 0.1)",
                      border: "1px solid rgba(0, 212, 255, 0.2)",
                      borderRadius: "0.5rem",
                      color: "#00d4ff",
                      cursor: "pointer",
                    }}
                  >
                    {showKeys[key] ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              );
            })}
            <button
              onClick={handleSaveApiKeys}
              disabled={saving}
              style={{
                padding: "0.75rem 1.5rem",
                background: "linear-gradient(135deg, #00d4ff 0%, #ff006e 100%)",
                border: "none",
                borderRadius: "0.5rem",
                color: "#000",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={16} />}
              Save API Keys
            </button>
          </div>
        )}

        {/* Providers Tab */}
        {activeTab === "providers" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Info banner */}
            <div style={{ padding: "1rem", background: "rgba(0, 212, 255, 0.07)", border: "1px solid rgba(0, 212, 255, 0.25)", borderRadius: "0.5rem", fontSize: "0.8rem", color: "rgba(255,255,255,0.7)", lineHeight: "1.5" }}>
              <strong style={{ color: "#00d4ff" }}>Active providers</strong> are highlighted. Add your own API key in the API Keys tab to use your own quota — otherwise the platform key is used.
            </div>

            {/* ── LLM Model selector ── */}
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", color: "#00d4ff", fontSize: "0.875rem", fontWeight: "600" }}>
                LLM Model
              </label>
              <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", marginBottom: "0.6rem" }}>
                Used for lyrics generation, prompt crafting, and director analysis. Models marked "own key" require a Gemini API key in the API Keys tab.
              </p>
              <select
                value={providers.llmModel}
                onChange={(e) => setProviders({ ...providers, llmModel: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "rgba(0, 212, 255, 0.05)",
                  border: "1px solid rgba(0, 212, 255, 0.3)",
                  borderRadius: "0.5rem",
                  color: "#fff",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <optgroup label="Gemini (platform key — no own key needed)">
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash — fast · default</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro — most capable</option>
                </optgroup>
                <optgroup label="Gemini (requires own Gemini API key)">
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash — fast · stable</option>
                  <option value="gemini-2.0-flash-thinking-exp">Gemini 2.0 Flash Thinking — reasoning</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro — long context</option>
                </optgroup>
                <optgroup label="ChatGPT (requires own OpenAI API key)">
                  <option value="gpt-4o">GPT-4o — powerful</option>
                  <option value="gpt-4o-mini">GPT-4o Mini — fast · cheap</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                </optgroup>
                <optgroup label="Claude (requires own Anthropic API key)">
                  <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku — fast · excellent quality</option>
                  <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet — best quality</option>
                </optgroup>
                <optgroup label="Groq / Llama (requires own Groq API key — FREE tier)">
                  <option value="llama-3.1-8b-instant">Llama 3.1 8B — ultra-fast · free</option>
                  <option value="llama-3.3-70b-versatile">Llama 3.3 70B — high quality · free</option>
                  <option value="qwen-2.5-7b-instruct">Qwen 2.5 7B — multilingual · free</option>
                </optgroup>
                <optgroup label="Mistral (requires own Mistral API key — FREE tier)">
                  <option value="mistral-small-latest">Mistral Small — fast · multilingual · free</option>
                </optgroup>
              </select>
              {providers.llmModel && providers.llmModel !== "gemini-2.5-flash" && (
                <p style={{ fontSize: "0.72rem", color: "rgba(255,200,50,0.75)", marginTop: "0.4rem" }}>
                  {["gemini-2.0-flash", "gemini-2.0-flash-thinking-exp", "gemini-1.5-pro"].includes(providers.llmModel)
                    ? "Requires your Gemini API key (API Keys tab)."
                    : providers.llmModel.startsWith("gpt-") || providers.llmModel.startsWith("o1-") || providers.llmModel.startsWith("o3-")
                    ? "Requires your OpenAI API key (API Keys tab)."
                    : providers.llmModel.startsWith("claude-")
                    ? "Requires your Anthropic API key (API Keys tab)."
                    : providers.llmModel.startsWith("llama-") || providers.llmModel.startsWith("qwen")
                    ? "Requires your Groq API key (API Keys tab). Free tier available at console.groq.com."
                    : providers.llmModel.startsWith("mistral-") || providers.llmModel.startsWith("codestral-")
                    ? "Requires your Mistral API key (API Keys tab). Free tier available at console.mistral.ai."
                    : "Make sure the API key for this model is saved in the API Keys tab."}
                </p>
              )}
            </div>

            {/* Lyrics */}
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", color: "#00d4ff", fontSize: "0.875rem", fontWeight: "600" }}>Lyrics Provider</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", background: "rgba(57,255,20,0.07)", border: "1px solid rgba(57,255,20,0.4)", borderRadius: "0.5rem" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#39ff14", flexShrink: 0 }} />
                  <span style={{ flex: 1, color: "#fff", fontSize: "0.875rem" }}>Gemini (Google) — model set above</span>
                  <span style={{ fontSize: "0.7rem", color: "#39ff14", fontWeight: "600" }}>ACTIVE</span>
                </div>
                {[
                  "GPT-4o / GPT-4o Mini (OpenAI)",
                  "Claude 3.5 Haiku (Anthropic)",
                  "Llama 3.1 / Qwen 2.5 (Groq — free)",
                  "Mistral Small (Mistral — free)",
                ].map((label) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", background: "rgba(57,255,20,0.04)", border: "1px solid rgba(57,255,20,0.2)", borderRadius: "0.5rem" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "rgba(57,255,20,0.5)", flexShrink: 0 }} />
                    <span style={{ flex: 1, color: "rgba(255,255,255,0.8)", fontSize: "0.875rem" }}>{label}</span>
                    <span style={{ fontSize: "0.7rem", color: "rgba(57,255,20,0.8)", fontWeight: "600" }}>SELECT ABOVE</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Images */}
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", color: "#ececf1", fontSize: "0.875rem", fontWeight: "600" }}>Image Generation</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {[
                  { label: "Pollinations.ai (Flux)", badge: "FREE · no key", note: "No setup needed. Works immediately.", active: true },
                  { label: "Together AI — FLUX.1-schnell-Free", badge: "FREE tier", note: "Needs Together API key (free signup).", active: true },
                  { label: "fal.ai — FLUX Schnell / Dev", badge: "Free credits", note: "~$0.003/image after free credits.", active: true },
                  { label: "Flux Dev / Schnell (Replicate)", badge: "Paid", note: "~$0.003–$0.01/image.", active: false },
                  { label: "DALL-E 3 / GPT-image-1 (OpenAI)", badge: "Paid", note: "~$0.04/image.", active: false },
                ].map(({ label, badge, note, active }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", background: active ? "rgba(16,163,127,0.07)" : "rgba(255,255,255,0.03)", border: `1px solid ${active ? "rgba(16,163,127,0.3)" : "rgba(255,255,255,0.08)"}`, borderRadius: "0.5rem" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: active ? "#10a37f" : "rgba(255,255,255,0.2)", flexShrink: 0 }} />
                    <span style={{ flex: 1, color: active ? "#ececf1" : "rgba(255,255,255,0.5)", fontSize: "0.875rem" }}>{label}</span>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: "0.65rem", fontWeight: 700, color: active ? "#10a37f" : "rgba(255,255,255,0.3)", letterSpacing: "0.04em" }}>{badge}</div>
                      <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.3)", marginTop: "1px" }}>{note}</div>
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", marginTop: "0.5rem" }}>
                Select the provider in Step 6 (Image Prompts) each time you generate.
              </p>
            </div>

            {/* Video */}
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", color: "#ececf1", fontSize: "0.875rem", fontWeight: "600" }}>Video Generation</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {[
                  { label: "fal.ai — Wan2.1 (1.3B)", badge: "Free credits", note: "~$0.025/clip after free credits.", active: true },
                  { label: "fal.ai — Kling v1.5", badge: "Free credits", note: "~$0.03/clip. Best quality.", active: true },
                  { label: "MiniMax Video-01-Live (Replicate)", badge: "Paid", note: "~$0.05/clip.", active: false },
                ].map(({ label, badge, note, active }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", background: active ? "rgba(16,163,127,0.07)" : "rgba(255,255,255,0.03)", border: `1px solid ${active ? "rgba(16,163,127,0.3)" : "rgba(255,255,255,0.08)"}`, borderRadius: "0.5rem" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: active ? "#10a37f" : "rgba(255,255,255,0.2)", flexShrink: 0 }} />
                    <span style={{ flex: 1, color: active ? "#ececf1" : "rgba(255,255,255,0.5)", fontSize: "0.875rem" }}>{label}</span>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: "0.65rem", fontWeight: 700, color: active ? "#10a37f" : "rgba(255,255,255,0.3)", letterSpacing: "0.04em" }}>{badge}</div>
                      <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.3)", marginTop: "1px" }}>{note}</div>
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", marginTop: "0.5rem" }}>
                Select the provider in Step 5 (Video Prompts). Add your fal.ai key above.
              </p>
            </div>

            {/* Save button */}
            <button
              onClick={handleSaveProviders}
              disabled={saving}
              style={{
                padding: "0.75rem 1.5rem",
                background: "linear-gradient(135deg, #00d4ff 0%, #ff006e 100%)",
                border: "none",
                borderRadius: "0.5rem",
                color: "#000",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={16} />}
              Save Providers
            </button>
          </div>
        )}

        {/* Budget Tab */}
        {activeTab === "budget" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", color: "#00d4ff", fontSize: "0.875rem", fontWeight: "600" }}>
                Monthly Budget (USD)
              </label>
              <input
                type="number"
                value={budget.monthlyBudgetUSD}
                onChange={(e) => setBudget({ ...budget, monthlyBudgetUSD: Number(e.target.value) })}
                min="1"
                step="0.01"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "rgba(0, 212, 255, 0.05)",
                  border: "1px solid rgba(0, 212, 255, 0.2)",
                  borderRadius: "0.5rem",
                  color: "#fff",
                  fontSize: "0.875rem",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", color: "#00d4ff", fontSize: "0.875rem", fontWeight: "600" }}>
                Budget Reset Day (1-31)
              </label>
              <input
                type="number"
                value={budget.budgetResetDay}
                onChange={(e) => setBudget({ ...budget, budgetResetDay: Math.min(31, Math.max(1, Number(e.target.value))) })}
                min="1"
                max="31"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "rgba(0, 212, 255, 0.05)",
                  border: "1px solid rgba(0, 212, 255, 0.2)",
                  borderRadius: "0.5rem",
                  color: "#fff",
                  fontSize: "0.875rem",
                }}
              />
            </div>
            <button
              onClick={handleSaveBudget}
              disabled={saving}
              style={{
                padding: "0.75rem 1.5rem",
                background: "linear-gradient(135deg, #00d4ff 0%, #ff006e 100%)",
                border: "none",
                borderRadius: "0.5rem",
                color: "#000",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={16} />}
              Save Budget
            </button>
          </div>
        )}

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
