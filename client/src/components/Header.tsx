import { useAuth } from "@/_core/hooks/useAuth";
import { Menu, X, Settings, LogOut, User } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  activeStep: number;
}

export default function Header({ sidebarOpen, onToggleSidebar, activeStep }: HeaderProps) {
  const { user, logout } = useAuth();
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
        padding: "1rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(10, 10, 20, 0.95)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      {/* Left side - Toggle button + Title */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {/* Toggle Sidebar Button */}
        <button
          onClick={onToggleSidebar}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "48px",
            height: "48px",
            borderRadius: "8px",
            border: "2px solid #00d4ff",
            background: "rgba(0, 212, 255, 0.15)",
            color: "#00d4ff",
            cursor: "pointer",
            transition: "all 250ms cubic-bezier(0.4, 0, 0.2, 1)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 0 20px rgba(0, 212, 255, 0.3)",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0, 212, 255, 0.25)";
            e.currentTarget.style.boxShadow = "0 0 30px rgba(0, 212, 255, 0.5)";
            e.currentTarget.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(0, 212, 255, 0.15)";
            e.currentTarget.style.boxShadow = "0 0 20px rgba(0, 212, 255, 0.3)";
            e.currentTarget.style.transform = "scale(1)";
          }}
          title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              height: "24px",
              width: "1px",
              background: "rgba(0, 212, 255, 0.4)",
            }}
          />
          <span
            style={{
              fontSize: "0.875rem",
              fontWeight: "600",
              color: "#00d4ff",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            Kishore's Studio
          </span>
        </div>
      </div>

      {/* Center - Step indicator */}
      <div
        style={{
          fontSize: "0.75rem",
          padding: "0.5rem 1rem",
          borderRadius: "6px",
          background: "rgba(0, 212, 255, 0.1)",
          color: "#00d4ff",
          border: "1px solid rgba(0, 212, 255, 0.3)",
          fontFamily: "'Inter', sans-serif",
          fontWeight: "600",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Step {activeStep} of 8
      </div>

      {/* Right side - User menu */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            background: "rgba(255, 255, 255, 0.05)",
            color: "#00d4ff",
            cursor: "pointer",
            transition: "all 250ms cubic-bezier(0.4, 0, 0.2, 1)",
            backdropFilter: "blur(10px)",
            fontSize: "0.875rem",
            fontWeight: "600",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0, 212, 255, 0.1)";
            e.currentTarget.style.borderColor = "#00d4ff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
          }}
        >
          <User size={18} />
          <span>{user?.name || "Profile"}</span>
        </button>

        {/* Dropdown menu */}
        {showMenu && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              marginTop: "0.5rem",
              background: "rgba(10, 10, 20, 0.98)",
              border: "1px solid rgba(0, 212, 255, 0.3)",
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
                borderBottom: "1px solid rgba(0, 212, 255, 0.2)",
              }}
            >
              <div style={{ color: "#00d4ff", fontSize: "0.875rem", fontWeight: "600" }}>
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
                color: "#00d4ff",
                cursor: "pointer",
                transition: "all 250ms",
                fontSize: "0.875rem",
                fontWeight: "500",
                borderBottom: "1px solid rgba(0, 212, 255, 0.1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(0, 212, 255, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
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
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 0, 110, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
