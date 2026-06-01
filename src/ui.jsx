// ─────────────────────────────────────────────────────────────────────────
//  LIBRERÍA DE COMPONENTES — Sistema de diseño TDC
//  Button · Card · KPICard · EstadoChip · MonedaChip · EmptyState ·
//  Skeleton · Toast (provider + useToast) · Hero
//  Hooks: useReducedMotion · useCountUp
// ─────────────────────────────────────────────────────────────────────────
import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { TDC, FONT, RADIUS, SHADOW, GRADIENT } from "./constants.js";

// ── Hooks ──────────────────────────────────────────────────────────────────
export function useReducedMotion() {
  const [reduced, setReduced] = useState(
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const fn = e => setReduced(e.matches);
    mq.addEventListener?.("change", fn);
    return () => mq.removeEventListener?.("change", fn);
  }, []);
  return reduced;
}

const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

// Cuenta animada hacia `target` con easeOutCubic. Respeta reduced-motion.
export function useCountUp(target, duration = 1500) {
  const reduced = useReducedMotion();
  const [val, setVal] = useState(target);
  const fromRef = useRef(target);
  const rafRef  = useRef(null);

  useEffect(() => {
    const to = Number(target) || 0;
    const from = Number(fromRef.current) || 0;
    if (reduced || from === to) { setVal(to); fromRef.current = to; return; }

    let start = null;
    const step = ts => {
      if (start === null) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(from + (to - from) * easeOutCubic(p));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
      else fromRef.current = to;
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, reduced]);

  return val;
}

// ── Button (3 variantes) ─────────────────────────────────────────────────────
//  variant: "primary" | "outline" | "danger"
export function Button({ variant = "primary", size = "md", leftIcon, children, style, disabled, ...rest }) {
  const sizes = {
    sm: { padding: "7px 14px", fontSize: 12 },
    md: { padding: "9px 18px", fontSize: 13 },
    lg: { padding: "11px 22px", fontSize: 14 },
  }[size];

  const variants = {
    primary: {
      border: "none",
      background: GRADIENT.glass,
      backdropFilter: "blur(8px)",
      color: "#fff",
      boxShadow: SHADOW.redGlow,
    },
    outline: {
      border: `1px solid ${TDC.border}`,
      background: "transparent",
      color: TDC.muted,
      boxShadow: "none",
    },
    danger: {
      border: `1px solid ${TDC.coral}`,
      background: TDC.redLight2,
      color: TDC.red600,
      boxShadow: "none",
    },
  }[variant];

  return (
    <button
      className="tdc-btn"
      disabled={disabled}
      style={{
        ...sizes, ...variants,
        borderRadius: RADIUS.md,
        fontFamily: FONT.sans, fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
        transition: "transform .15s ease, box-shadow .2s ease, filter .2s ease",
        whiteSpace: "nowrap",
        ...style,
      }}
      {...rest}
    >
      {leftIcon && <span style={{ fontSize: "1.1em", lineHeight: 1 }}>{leftIcon}</span>}
      {children}
    </button>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, hover = false, accent, style, ...rest }) {
  return (
    <div
      className={hover ? "tdc-card-hover" : ""}
      style={{
        background: TDC.card,
        border: `1px solid ${TDC.border}`,
        borderRadius: RADIUS.lg,
        padding: 20,
        boxShadow: SHADOW.sm,
        ...(accent ? { borderLeft: `4px solid ${accent}` } : {}),
        transition: "transform .2s ease, box-shadow .2s ease",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

// ── KPICard (conteo animado) ───────────────────────────────────────────────────
//  value: número | string. Si es número, anima con easeOutCubic 1500ms.
export function KPICard({ label, value, format = v => v, color = TDC.ink, accent, sub, icon }) {
  const isNum = typeof value === "number";
  const animated = useCountUp(isNum ? value : 0);
  const display = isNum ? format(animated) : value;
  return (
    <Card hover accent={accent || color}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: TDC.faint, textTransform: "uppercase", letterSpacing: ".8px" }}>{label}</div>
        {icon && <span style={{ fontSize: 15, opacity: .8 }}>{icon}</span>}
      </div>
      <div style={{ fontFamily: FONT.num, fontVariantNumeric: "tabular-nums", fontSize: 22, fontWeight: 700, color, marginTop: 6, letterSpacing: "-0.5px" }}>
        {display}
      </div>
      {sub && <div style={{ fontSize: 11, color: TDC.faint, marginTop: 3 }}>{sub}</div>}
    </Card>
  );
}

// ── EstadoChip (pill + ícono, color semántico) ─────────────────────────────────
//  tone: "success" | "warn" | "info" | "danger" | "neutral"
const TONES = {
  success: { fg: TDC.green,  bg: "#DCFCE7", icon: "▲" },
  danger:  { fg: TDC.red600, bg: TDC.redLight2, icon: "▼" },
  warn:    { fg: TDC.amber,  bg: "#FEF3C7", icon: "•" },
  info:    { fg: "#1E78A8",  bg: "#E6F2FA", icon: "•" },
  neutral: { fg: TDC.muted,  bg: TDC.bg,    icon: "•" },
};
export function EstadoChip({ tone = "neutral", label, icon, style }) {
  const t = TONES[tone] || TONES.neutral;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: t.bg, color: t.fg,
      border: `1px solid ${t.fg}22`,
      borderRadius: RADIUS.pill, padding: "2px 10px",
      fontSize: 10, fontWeight: 700, fontFamily: FONT.sans, whiteSpace: "nowrap",
      ...style,
    }}>
      <span style={{ fontSize: 9, lineHeight: 1 }}>{icon ?? t.icon}</span>{label}
    </span>
  );
}

// ── MonedaChip ─────────────────────────────────────────────────────────────────
export function MonedaChip({ moneda, style }) {
  const dolar = moneda === "Dólares ($)";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      background: dolar ? "#E6F2FA" : TDC.bg,
      color: dolar ? "#1E78A8" : TDC.muted,
      border: `1px solid ${dolar ? TDC.sky + "55" : TDC.border}`,
      borderRadius: RADIUS.pill, padding: "1px 9px",
      fontFamily: FONT.num, fontVariantNumeric: "tabular-nums",
      fontSize: 10, fontWeight: 700, whiteSpace: "nowrap",
      ...style,
    }}>
      {dolar ? "$ USD" : "S/ PEN"}
    </span>
  );
}

// ── EmptyState ─────────────────────────────────────────────────────────────────
export function EmptyState({ icon = "📋", title, subtitle, children, compact = false }) {
  return (
    <div style={{ textAlign: "center", padding: compact ? "26px 16px" : "56px 24px", color: TDC.muted }}>
      <div style={{ fontSize: compact ? 28 : 38, marginBottom: 10, opacity: .9 }}>{icon}</div>
      {title && <div style={{ fontWeight: 700, color: TDC.muted, fontSize: compact ? 14 : 15, fontFamily: FONT.sans }}>{title}</div>}
      {subtitle && <div style={{ color: TDC.faint, fontSize: 13, marginTop: 6 }}>{subtitle}</div>}
      {children && <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>{children}</div>}
    </div>
  );
}

// ── Skeleton (shimmer) ─────────────────────────────────────────────────────────
export function Skeleton({ w = "100%", h = 14, radius = RADIUS.sm, style }) {
  return (
    <span
      className="tdc-skeleton"
      style={{ display: "block", width: w, height: h, borderRadius: radius, ...style }}
    />
  );
}

// ── Hero (gradiente de marca, 5 radiales + base linear) ────────────────────────
export function Hero({ title, subtitle, right, children, style }) {
  return (
    <div style={{
      position: "relative", overflow: "hidden",
      borderRadius: RADIUS.lg, padding: "26px 28px",
      background: GRADIENT.hero, color: "#fff",
      boxShadow: SHADOW.md,
      ...style,
    }}>
      <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          {title && <div style={{ fontFamily: FONT.sans, fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px" }}>{title}</div>}
          {subtitle && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.82)", marginTop: 4 }}>{subtitle}</div>}
          {children}
        </div>
        {right}
      </div>
    </div>
  );
}

// ── Toast (provider + hook) ────────────────────────────────────────────────────
const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx) || (() => {});

const TOAST_TONES = {
  success: { fg: TDC.green,  icon: "✓" },
  error:   { fg: TDC.red600, icon: "⚠" },
  info:    { fg: "#1E78A8",  icon: "ℹ" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback(id => setToasts(t => t.filter(x => x.id !== id)), []);

  const toast = useCallback((message, opts = {}) => {
    const id = ++idRef.current;
    const tone = opts.tone || "success";
    setToasts(t => [...t, { id, message, tone }]);
    const ttl = opts.duration ?? 3200;
    if (ttl) setTimeout(() => dismiss(id), ttl);
    return id;
  }, [dismiss]);

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div style={{ position: "fixed", right: 18, bottom: 18, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10, maxWidth: 360 }}>
        {toasts.map(t => {
          const tone = TOAST_TONES[t.tone] || TOAST_TONES.info;
          return (
            <div key={t.id} className="tdc-toast" onClick={() => dismiss(t.id)} style={{
              display: "flex", alignItems: "center", gap: 10,
              background: TDC.card, border: `1px solid ${TDC.border}`,
              borderLeft: `4px solid ${tone.fg}`,
              borderRadius: RADIUS.md, padding: "11px 14px",
              boxShadow: SHADOW.lg, cursor: "pointer",
              fontFamily: FONT.sans, fontSize: 13, color: TDC.ink,
            }}>
              <span style={{ color: tone.fg, fontWeight: 800, fontSize: 14 }}>{tone.icon}</span>
              <span style={{ fontWeight: 500 }}>{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
