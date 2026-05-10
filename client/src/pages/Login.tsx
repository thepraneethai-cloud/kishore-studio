import { useState } from "react";
import { Eye, EyeOff, Lock, Loader2 } from "lucide-react";

export default function Login() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.href = "/";
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Invalid password");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a14 0%, #1a1a2e 50%, #16213e 100%)",
        backgroundAttachment: "fixed",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(0, 212, 255, 0.2)",
          borderRadius: "16px",
          padding: "2.5rem",
          backdropFilter: "blur(20px)",
          boxShadow: "0 0 60px rgba(0, 212, 255, 0.1)",
        }}
      >
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #00d4ff, #00f0ff)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              margin: "0 auto 1rem",
            }}
          >
            🕉
          </div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: "700",
              color: "#00d4ff",
              margin: 0,
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            Kishore's Studio
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem", marginTop: "0.5rem", marginBottom: 0 }}>
            Telugu Devotional Song Creator
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ position: "relative" }}>
            <Lock
              size={16}
              style={{
                position: "absolute",
                left: "1rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "rgba(0, 212, 255, 0.6)",
                pointerEvents: "none",
              }}
            />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              style={{
                width: "100%",
                padding: "0.875rem 3rem 0.875rem 2.75rem",
                background: "rgba(0, 212, 255, 0.05)",
                border: "1px solid rgba(0, 212, 255, 0.3)",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "1rem",
                fontFamily: "'Inter', sans-serif",
                outline: "none",
                boxSizing: "border-box",
                transition: "all 250ms",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#00d4ff";
                e.currentTarget.style.boxShadow = "0 0 20px rgba(0, 212, 255, 0.2)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(0, 212, 255, 0.3)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "1rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "rgba(255,255,255,0.4)",
                padding: 0,
                display: "flex",
                alignItems: "center",
              }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && (
            <p style={{ color: "#ff006e", fontSize: "0.875rem", margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={!password || loading}
            style={{
              padding: "0.875rem",
              background:
                password && !loading
                  ? "linear-gradient(135deg, #00d4ff, #00f0ff)"
                  : "rgba(255,255,255,0.08)",
              border: "none",
              borderRadius: "8px",
              color: password && !loading ? "#000" : "rgba(255,255,255,0.3)",
              fontSize: "1rem",
              fontWeight: "700",
              cursor: password && !loading ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              transition: "all 250ms",
              boxShadow: password && !loading ? "0 0 20px rgba(0, 212, 255, 0.4)" : "none",
              letterSpacing: "0.5px",
            }}
          >
            {loading && <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />}
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
}
