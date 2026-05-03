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
  });
  const [showKeys, setShowKeys] = useState({
    openaiApiKey: false,
    claudeApiKey: false,
    geminiApiKey: false,
    replicateApiKey: false,
  });
  const [providers, setProviders] = useState({
    lyricsProvider: "chatgpt",
    imageProvider: "flux",
    videoProvider: "runway",
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
      });
      setProviders({
        lyricsProvider: (settings.lyricsProvider as any) || "chatgpt",
        imageProvider: (settings.imageProvider as any) || "flux",
        videoProvider: (settings.videoProvider as any) || "runway",
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
            {(["openaiApiKey", "claudeApiKey", "geminiApiKey", "replicateApiKey"] as const).map((key) => (
              <div key={key}>
                <label style={{ display: "block", marginBottom: "0.5rem", color: "#00d4ff", fontSize: "0.875rem", fontWeight: "600" }}>
                  {key === "openaiApiKey"
                    ? "OpenAI API Key (ChatGPT)"
                    : key === "claudeApiKey"
                      ? "Claude API Key"
                      : key === "geminiApiKey"
                        ? "Gemini API Key"
                        : "Replicate API Key"}
                </label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type={showKeys[key] ? "text" : "password"}
                    value={apiKeys[key]}
                    onChange={(e) => setApiKeys({ ...apiKeys, [key]: e.target.value })}
                    placeholder="Enter your API key"
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
            ))}
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
            {(["lyricsProvider", "imageProvider", "videoProvider"] as const).map((key) => (
              <div key={key}>
                <label style={{ display: "block", marginBottom: "0.5rem", color: "#00d4ff", fontSize: "0.875rem", fontWeight: "600" }}>
                  {key === "lyricsProvider" ? "Lyrics Provider" : key === "imageProvider" ? "Image Provider" : "Video Provider"}
                </label>
                <select
                  value={providers[key]}
                  onChange={(e) => setProviders({ ...providers, [key]: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    background: "rgba(0, 212, 255, 0.05)",
                    border: "1px solid rgba(0, 212, 255, 0.2)",
                    borderRadius: "0.5rem",
                    color: "#fff",
                    fontSize: "0.875rem",
                  }}
                >
                  {key === "lyricsProvider" && (
                    <>
                      <option value="chatgpt">ChatGPT (OpenAI)</option>
                      <option value="claude">Claude (Anthropic)</option>
                      <option value="gemini">Gemini (Google)</option>
                    </>
                  )}
                  {key === "imageProvider" && (
                    <>
                      <option value="flux">Flux (Replicate)</option>
                      <option value="dalle">DALL-E (OpenAI)</option>
                      <option value="midjourney">Midjourney</option>
                    </>
                  )}
                  {key === "videoProvider" && (
                    <>
                      <option value="runway">Runway Gen-3</option>
                      <option value="grok">Grok Photo→Video</option>
                      <option value="pika">Pika</option>
                    </>
                  )}
                </select>
              </div>
            ))}
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
