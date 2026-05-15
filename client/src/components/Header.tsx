import { useAuth } from "@/_core/hooks/useAuth";
import { useIsMobile } from "@/hooks/useMobile";
import { Menu, X, Settings, LogOut, User } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  activeStep: number;
}

export default function Header({ sidebarOpen, onToggleSidebar, activeStep }: HeaderProps) {
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        padding: isMobile ? "0.75rem 1rem" : "1rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#212121",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        gap: "0.5rem",
      }}
    >
      {/* Left side - Toggle button + Title */}
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "0.5rem" : "1rem", minWidth: 0 }}>
        {/* Toggle Sidebar Button */}
        <button
          onClick={onToggleSidebar}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: isMobile ? "36px" : "36px",
            height: isMobile ? "36px" : "36px",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.06)",
            color: "#ececf1",
            cursor: "pointer",
            transition: "all 200ms",
            flexShrink: 0,
          }}
          title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? <X size={isMobile ? 18 : 24} /> : <Menu size={isMobile ? 18 : 24} />}
        </button>

        {/* Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
          <div
            style={{
              height: "24px",
              width: "1px",
              background: "rgba(0, 212, 255, 0.4)",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: isMobile ? "0.8rem" : "0.875rem",
              fontWeight: "600",
              color: "#ececf1",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {isMobile ? "Studio" : "Kishore's Studio"}
          </span>
        </div>
      </div>

      {/* Center - Step indicator (hidden on small mobile) */}
      {!isMobile && (
        <div
          style={{
            fontSize: "0.75rem",
            padding: "0.35rem 0.85rem",
            borderRadius: "6px",
            background: "rgba(255,255,255,0.06)",
            color: "rgba(236,236,241,0.6)",
            border: "1px solid rgba(255,255,255,0.1)",
            fontWeight: "500",
            letterSpacing: "0.03em",
            flexShrink: 0,
          }}
        >
          Step {activeStep} of 7
        </div>
      )}

      {/* Right side - User menu */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: isMobile ? "0" : "0.5rem",
            padding: isMobile ? "0.45rem" : "0.45rem 0.85rem",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.06)",
            color: "#ececf1",
            cursor: "pointer",
            transition: "all 200ms",
            fontSize: "0.8rem",
            fontWeight: "500",
            width: isMobile ? "36px" : "auto",
            height: isMobile ? "36px" : "auto",
          }}
        >
          <User size={18} />
          {!isMobile && <span>{user?.name || "Profile"}</span>}
        </button>

        {/* Dropdown menu */}
        {showMenu && (
          <>
            {/* Backdrop to close dropdown */}
            <div
              style={{ position: "fixed", inset: 0, zIndex: 90 }}
              onClick={() => setShowMenu(false)}
            />
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: "0.5rem",
                background: "#2f2f2f",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                backdropFilter: "blur(10px)",
                boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
                minWidth: "200px",
                zIndex: 100,
              }}
            >
              {/* Profile info */}
              <div
                style={{
                  padding: "1rem",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div style={{ color: "#ececf1", fontSize: "0.875rem", fontWeight: "600" }}>
                  {user?.name}
                </div>
                <div style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "0.75rem" }}>
                  {user?.email}
                </div>
              </div>

              {/* Settings option */}
              <button
                onClick={() => {
                  setShowMenu(false);
                  window.location.href = '/settings';
                }}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  background: "transparent",
                  border: "none",
                  color: "#ececf1",
                  cursor: "pointer",
                  transition: "all 200ms",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  borderBottom: "1px solid rgba(255,255,255,0.07)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0, 212, 255, 0.1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <Settings size={18} />
                Settings
              </button>

              {/* Logout option */}
              <button
                onClick={handleLogout}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  background: "transparent",
                  border: "none",
                  color: "#ff006e",
                  cursor: "pointer",
                  transition: "all 250ms",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255, 0, 110, 0.1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
