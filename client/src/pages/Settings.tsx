import { useState } from "react";
import { Eye, EyeOff, Save, AlertCircle } from "lucide-react";

export default function Settings() {
  const [activeTab, setActiveTab] = useState<"api-keys" | "providers" | "budget">("api-keys");
  const [apiKeys, setApiKeys] = useState({
    openai: "",
    replicate: "",
    anthropic: "",
  });
  const [showKeys, setShowKeys] = useState({
    openai: false,
    replicate: false,
    anthropic: false,
  });
  const [providers, setProviders] = useState({
    lyrics: "chatgpt",
    images: "flux",
    videos: "runway",
  });
  const [budget, setBudget] = useState({
    monthlyLimit: 50,
    spent: 12.34,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
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
          paddingBottom: "1rem",
        }}
      >
        {(["api-keys", "providers", "budget"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              border: "none",
              background: activeTab === tab ? "rgba(0, 212, 255, 0.15)" : "transparent",
              color: activeTab === tab ? "#00d4ff" : "rgba(255, 255, 255, 0.6)",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "0.875rem",
              transition: "all 250ms",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab) {
                e.currentTarget.style.color = "#00d4ff";
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab) {
                e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)";
              }
            }}
          >
            {tab === "api-keys" && "API Keys"}
            {tab === "providers" && "Providers"}
            {tab === "budget" && "Budget"}
          </button>
        ))}
      </div>

      {/* API Keys Tab */}
      {activeTab === "api-keys" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* OpenAI */}
          <div
            style={{
              padding: "1.5rem",
              borderRadius: "12px",
              background: "rgba(0, 212, 255, 0.05)",
              border: "1px solid rgba(0, 212, 255, 0.2)",
            }}
          >
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                color: "#00d4ff",
                fontWeight: "600",
                fontSize: "0.875rem",
              }}
            >
              OpenAI API Key (ChatGPT, DALL-E)
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type={showKeys.openai ? "text" : "password"}
                value={apiKeys.openai}
                onChange={(e) => setApiKeys({ ...apiKeys, openai: e.target.value })}
                placeholder="sk-..."
                style={{
                  flex: 1,
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  border: "1px solid rgba(0, 212, 255, 0.3)",
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "#fff",
                  fontFamily: "monospace",
                  fontSize: "0.875rem",
                }}
              />
              <button
                onClick={() => setShowKeys({ ...showKeys, openai: !showKeys.openai })}
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  border: "1px solid rgba(0, 212, 255, 0.3)",
                  background: "rgba(0, 212, 255, 0.1)",
                  color: "#00d4ff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                {showKeys.openai ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.4)", marginTop: "0.5rem" }}>
              Get your key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" style={{ color: "#00d4ff" }}>platform.openai.com</a>
            </p>
          </div>

          {/* Replicate */}
          <div
            style={{
              padding: "1.5rem",
              borderRadius: "12px",
              background: "rgba(0, 212, 255, 0.05)",
              border: "1px solid rgba(0, 212, 255, 0.2)",
            }}
          >
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                color: "#00d4ff",
                fontWeight: "600",
                fontSize: "0.875rem",
              }}
            >
              Replicate API Key (Flux, Runway, Video Generation)
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type={showKeys.replicate ? "text" : "password"}
                value={apiKeys.replicate}
                onChange={(e) => setApiKeys({ ...apiKeys, replicate: e.target.value })}
                placeholder="r8_..."
                style={{
                  flex: 1,
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  border: "1px solid rgba(0, 212, 255, 0.3)",
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "#fff",
                  fontFamily: "monospace",
                  fontSize: "0.875rem",
                }}
              />
              <button
                onClick={() => setShowKeys({ ...showKeys, replicate: !showKeys.replicate })}
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  border: "1px solid rgba(0, 212, 255, 0.3)",
                  background: "rgba(0, 212, 255, 0.1)",
                  color: "#00d4ff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                {showKeys.replicate ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.4)", marginTop: "0.5rem" }}>
              Get your key from <a href="https://replicate.com/account/api-tokens" target="_blank" rel="noreferrer" style={{ color: "#00d4ff" }}>replicate.com</a>
            </p>
          </div>

          {/* Anthropic */}
          <div
            style={{
              padding: "1.5rem",
              borderRadius: "12px",
              background: "rgba(0, 212, 255, 0.05)",
              border: "1px solid rgba(0, 212, 255, 0.2)",
            }}
          >
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                color: "#00d4ff",
                fontWeight: "600",
                fontSize: "0.875rem",
              }}
            >
              Anthropic API Key (Claude)
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type={showKeys.anthropic ? "text" : "password"}
                value={apiKeys.anthropic}
                onChange={(e) => setApiKeys({ ...apiKeys, anthropic: e.target.value })}
                placeholder="sk-ant-..."
                style={{
                  flex: 1,
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  border: "1px solid rgba(0, 212, 255, 0.3)",
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "#fff",
                  fontFamily: "monospace",
                  fontSize: "0.875rem",
                }}
              />
              <button
                onClick={() => setShowKeys({ ...showKeys, anthropic: !showKeys.anthropic })}
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  border: "1px solid rgba(0, 212, 255, 0.3)",
                  background: "rgba(0, 212, 255, 0.1)",
                  color: "#00d4ff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                {showKeys.anthropic ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.4)", marginTop: "0.5rem" }}>
              Get your key from <a href="https://console.anthropic.com/account/keys" target="_blank" rel="noreferrer" style={{ color: "#00d4ff" }}>console.anthropic.com</a>
            </p>
          </div>
        </div>
      )}

      {/* Providers Tab */}
      {activeTab === "providers" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Lyrics Provider */}
          <div
            style={{
              padding: "1.5rem",
              borderRadius: "12px",
              background: "rgba(0, 212, 255, 0.05)",
              border: "1px solid rgba(0, 212, 255, 0.2)",
            }}
          >
            <label
              style={{
                display: "block",
                marginBottom: "1rem",
                color: "#00d4ff",
                fontWeight: "600",
                fontSize: "0.875rem",
              }}
            >
              Lyrics Generation Provider
            </label>
            <select
              value={providers.lyrics}
              onChange={(e) => setProviders({ ...providers, lyrics: e.target.value })}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                border: "1px solid rgba(0, 212, 255, 0.3)",
                background: "rgba(255, 255, 255, 0.05)",
                color: "#00d4ff",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              <option value="chatgpt">ChatGPT (OpenAI)</option>
              <option value="claude">Claude (Anthropic)</option>
              <option value="gemini">Gemini (Google)</option>
            </select>
          </div>

          {/* Image Provider */}
          <div
            style={{
              padding: "1.5rem",
              borderRadius: "12px",
              background: "rgba(0, 212, 255, 0.05)",
              border: "1px solid rgba(0, 212, 255, 0.2)",
            }}
          >
            <label
              style={{
                display: "block",
                marginBottom: "1rem",
                color: "#00d4ff",
                fontWeight: "600",
                fontSize: "0.875rem",
              }}
            >
              Image Generation Provider
            </label>
            <select
              value={providers.images}
              onChange={(e) => setProviders({ ...providers, images: e.target.value })}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                border: "1px solid rgba(0, 212, 255, 0.3)",
                background: "rgba(255, 255, 255, 0.05)",
                color: "#00d4ff",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              <option value="flux">Flux (Replicate) - $0.04/image</option>
              <option value="dalle">DALL-E 3 (OpenAI) - $0.04/image</option>
              <option value="stable">Stable Diffusion (Replicate) - $0.004/image</option>
            </select>
          </div>

          {/* Video Provider */}
          <div
            style={{
              padding: "1.5rem",
              borderRadius: "12px",
              background: "rgba(0, 212, 255, 0.05)",
              border: "1px solid rgba(0, 212, 255, 0.2)",
            }}
          >
            <label
              style={{
                display: "block",
                marginBottom: "1rem",
                color: "#00d4ff",
                fontWeight: "600",
                fontSize: "0.875rem",
              }}
            >
              Video Generation Provider
            </label>
            <select
              value={providers.videos}
              onChange={(e) => setProviders({ ...providers, videos: e.target.value })}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                border: "1px solid rgba(0, 212, 255, 0.3)",
                background: "rgba(255, 255, 255, 0.05)",
                color: "#00d4ff",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              <option value="runway">Runway Gen-3 (Replicate) - $0.07/5s</option>
              <option value="pika">Pika - $0.05/video</option>
              <option value="grok">Grok Photo→Video - Free tier available</option>
            </select>
          </div>
        </div>
      )}

      {/* Budget Tab */}
      {activeTab === "budget" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Budget Card */}
          <div
            style={{
              padding: "1.5rem",
              borderRadius: "12px",
              background: "rgba(0, 212, 255, 0.05)",
              border: "1px solid rgba(0, 212, 255, 0.2)",
            }}
          >
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                color: "#00d4ff",
                fontWeight: "600",
                fontSize: "0.875rem",
              }}
            >
              Monthly Budget Limit (USD)
            </label>
            <input
              type="number"
              value={budget.monthlyLimit}
              onChange={(e) => setBudget({ ...budget, monthlyLimit: parseFloat(e.target.value) })}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                border: "1px solid rgba(0, 212, 255, 0.3)",
                background: "rgba(255, 255, 255, 0.05)",
                color: "#00d4ff",
                fontSize: "0.875rem",
              }}
            />
          </div>

          {/* Usage Card */}
          <div
            style={{
              padding: "1.5rem",
              borderRadius: "12px",
              background: "rgba(255, 0, 110, 0.05)",
              border: "1px solid rgba(255, 0, 110, 0.2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
              <AlertCircle size={20} style={{ color: "#ff006e" }} />
              <span style={{ color: "#ff006e", fontWeight: "600" }}>Current Usage This Month</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ color: "rgba(255, 255, 255, 0.6)" }}>Spent:</span>
              <span style={{ color: "#00d4ff", fontWeight: "600" }}>${budget.spent.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
              <span style={{ color: "rgba(255, 255, 255, 0.6)" }}>Remaining:</span>
              <span style={{ color: "#39ff14", fontWeight: "600" }}>
                ${(budget.monthlyLimit - budget.spent).toFixed(2)}
              </span>
            </div>
            {/* Progress bar */}
            <div
              style={{
                width: "100%",
                height: "8px",
                borderRadius: "4px",
                background: "rgba(255, 255, 255, 0.1)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(budget.spent / budget.monthlyLimit) * 100}%`,
                  background: budget.spent / budget.monthlyLimit > 0.8 ? "#ff006e" : "#00d4ff",
                  transition: "width 250ms",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={handleSave}
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: "8px",
            border: "none",
            background: saved ? "rgba(57, 255, 20, 0.2)" : "rgba(0, 212, 255, 0.2)",
            color: saved ? "#39ff14" : "#00d4ff",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "0.875rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            transition: "all 250ms",
          }}
        >
          <Save size={18} />
          {saved ? "Saved!" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
