// ============================================================
// Glassmorphism UI Components - Reusable Patterns
// ============================================================

export const glassStyles = {
  panel: {
    padding: "1rem",
    background: "rgba(0, 212, 255, 0.08)",
    border: "1px solid rgba(0, 212, 255, 0.2)",
    borderRadius: "0.5rem",
    backdropFilter: "blur(10px)",
  },
  input: {
    padding: "0.75rem",
    background: "rgba(0, 212, 255, 0.05)",
    border: "1px solid rgba(0, 212, 255, 0.2)",
    borderRadius: "0.5rem",
    color: "#fff",
    fontSize: "0.875rem",
  },
  button: {
    primary: {
      padding: "0.75rem 1.5rem",
      background: "linear-gradient(135deg, #00d4ff 0%, #ff006e 100%)",
      border: "none",
      borderRadius: "0.5rem",
      color: "#000",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 200ms",
    },
    secondary: {
      padding: "0.75rem 1rem",
      background: "rgba(0, 212, 255, 0.1)",
      border: "1px solid rgba(0, 212, 255, 0.3)",
      borderRadius: "0.5rem",
      color: "#00d4ff",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 200ms",
    },
  },
  text: {
    heading: {
      fontSize: "1.875rem",
      fontWeight: "700",
      fontFamily: "'Space Grotesk', sans-serif",
      color: "#00d4ff",
    },
    subheading: {
      fontSize: "0.875rem",
      fontWeight: "600",
      fontFamily: "'Space Grotesk', sans-serif",
      color: "#00d4ff",
    },
    label: {
      fontSize: "0.75rem",
      fontWeight: "600",
      color: "rgba(255, 255, 255, 0.6)",
    },
    body: {
      fontSize: "0.875rem",
      color: "rgba(255, 255, 255, 0.7)",
    },
    muted: {
      fontSize: "0.75rem",
      color: "rgba(255, 255, 255, 0.5)",
    },
  },
  colors: {
    cyan: "#00d4ff",
    pink: "#ff006e",
    lime: "#39ff14",
    dark: "#0a0a14",
    darkGray: "rgba(0, 0, 0, 0.3)",
  },
};

export function GlassPanel({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ ...glassStyles.panel, ...style }}>{children}</div>;
}

export function GlassButton({
  children,
  onClick,
  disabled = false,
  variant = "primary",
  style = {},
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  style?: React.CSSProperties;
}) {
  const baseStyle = variant === "primary" ? glassStyles.button.primary : glassStyles.button.secondary;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...baseStyle,
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function GlassInput({
  value,
  onChange,
  placeholder = "",
  type = "text",
  style = {},
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  style?: React.CSSProperties;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        ...glassStyles.input,
        ...style,
      }}
    />
  );
}

export function GlassTextarea({
  value,
  onChange,
  placeholder = "",
  rows = 4,
  style = {},
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  style?: React.CSSProperties;
}) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      style={{
        ...glassStyles.input,
        resize: "vertical",
        ...style,
      }}
    />
  );
}

export function GlassSelect({
  value,
  onChange,
  options,
  style = {},
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { label: string; value: string }[];
  style?: React.CSSProperties;
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      style={{
        ...glassStyles.input,
        ...style,
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export function GlassHeading({ children, level = 2, style = {} }: { children: React.ReactNode; level?: 1 | 2 | 3; style?: React.CSSProperties }) {
  const headingStyle = level === 1 ? { ...glassStyles.text.heading, ...style } : { ...glassStyles.text.subheading, ...style };
  if (level === 1) return <h1 style={headingStyle}>{children}</h1>;
  if (level === 3) return <h3 style={headingStyle}>{children}</h3>;
  return <h2 style={headingStyle}>{children}</h2>;
}

export function GlassLabel({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <label style={{ ...glassStyles.text.label, ...style }}>{children}</label>;
}

export function GlassText({ children, variant = "body", style = {} }: { children: React.ReactNode; variant?: "body" | "muted"; style?: React.CSSProperties }) {
  const textStyle = variant === "muted" ? glassStyles.text.muted : glassStyles.text.body;
  return <p style={{ ...textStyle, ...style }}>{children}</p>;
}

export function GlassDivider({ style = {} }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        height: "1px",
        background: "linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.3), transparent)",
        ...style,
      }}
    />
  );
}
