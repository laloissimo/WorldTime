"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  TIMEZONE_DB, DEFAULT_ZONES,
  getTimeInZone, getDateInZone, getUTCOffset, getAbbr,
  getDSTInfo, isDaytime, applyTimeDelta,
  loadSavedZones, saveZones, loadSavedLang, saveLang,
} from "../lib/timezones";
import { T, LANGUAGES, detectLanguage } from "../lib/i18n";

// ─────────────────────────────────────────────────────────────────────────────
// DST Badge
// ─────────────────────────────────────────────────────────────────────────────
function DSTBadge({ info, t }) {
  if (!info) return null;
  const urgent = info.days <= 7;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 10, fontWeight: 600, letterSpacing: ".04em",
      padding: "2px 8px", borderRadius: 20,
      background: urgent ? "rgba(234,179,8,.18)" : "rgba(234,179,8,.1)",
      color: urgent ? "#fbbf24" : "#f59e0b",
      border: `1px solid ${urgent ? "rgba(251,191,36,.35)" : "rgba(245,158,11,.2)"}`,
      whiteSpace: "nowrap",
    }}>
      ⚠ {t.dstIn} {info.days}{info.days === 1 ? t.dstDay : ""}d
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sun / Moon icon
// ─────────────────────────────────────────────────────────────────────────────
function SunMoonIcon({ day }) {
  return day ? (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ opacity: .6 }}>
      <circle cx="12" cy="12" r="5" stroke="#fbbf24" strokeWidth="2" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ) : (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ opacity: .5 }}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Clock Dial Picker
// ─────────────────────────────────────────────────────────────────────────────
function ClockDial({ initialH, initialM, onConfirm, onClose, t }) {
  const [step, setStep] = useState("hour");
  const [selH, setSelH] = useState(initialH);
  const [selM, setSelM] = useState(initialM);
  const dialRef = useRef(null);
  const SIZE = 220, CX = 110, CY = 110, R = 80, DOT_R = 22;

  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);
  const outerHours = Array.from({ length: 12 }, (_, i) => i);
  const innerHours = Array.from({ length: 12 }, (_, i) => i + 12);

  function polarToXY(value, total, radius) {
    const angle = (value / total) * 2 * Math.PI - Math.PI / 2;
    return { x: CX + radius * Math.cos(angle), y: CY + radius * Math.sin(angle) };
  }

  function xyToValue(clientX, clientY, total) {
    const rect = dialRef.current.getBoundingClientRect();
    const x = clientX - rect.left - CX;
    const y = clientY - rect.top - CY;
    let angle = Math.atan2(y, x) + Math.PI / 2;
    if (angle < 0) angle += 2 * Math.PI;
    const raw = Math.round((angle / (2 * Math.PI)) * total);
    return raw === total ? 0 : raw;
  }

  function handleDialClick(e) {
    const touch = e.touches?.[0] || e;
    if (step === "hour") {
      const h = xyToValue(touch.clientX, touch.clientY, 24);
      setSelH(h); setTimeout(() => setStep("minute"), 180);
    } else {
      const m = xyToValue(touch.clientX, touch.clientY, 60);
      setSelM(Math.round(m / 5) * 5 % 60);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.7)",
      backdropFilter: "blur(8px)", display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 300,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "rgba(10,18,35,.98)", border: "1px solid rgba(255,255,255,.12)",
        borderRadius: 22, padding: "24px 24px 20px", width: 270,
        boxShadow: "0 32px 80px rgba(0,0,0,.8)",
      }}>
        {/* HH:MM display */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 18 }}>
          {[{ val: selH, key: "hour" }, null, { val: selM, key: "minute" }].map((item, i) =>
            item === null ? (
              <span key="colon" style={{ fontSize: 36, color: "rgba(148,163,184,.4)", fontWeight: 200 }}>:</span>
            ) : (
              <span key={item.key} onClick={() => setStep(item.key)} style={{
                fontFamily: "monospace", fontSize: 40, fontWeight: 300,
                color: step === item.key ? "#6ee7b7" : "rgba(148,163,184,.5)",
                cursor: "pointer", padding: "2px 6px", borderRadius: 8,
                background: step === item.key ? "rgba(110,231,183,.1)" : "transparent",
                border: `1px solid ${step === item.key ? "rgba(110,231,183,.25)" : "transparent"}`,
                transition: "all .15s",
              }}>{String(item.val).padStart(2, "0")}</span>
            )
          )}
        </div>
        <div style={{ textAlign: "center", fontSize: 10, color: "rgba(148,163,184,.4)", marginBottom: 12, letterSpacing: ".06em", textTransform: "uppercase" }}>
          {step === "hour" ? t.selectHour : t.selectMinute}
        </div>

        <svg ref={dialRef} width={SIZE} height={SIZE}
          style={{ display: "block", margin: "0 auto", cursor: "pointer", touchAction: "none" }}
          onClick={handleDialClick} onTouchStart={e => { e.preventDefault(); handleDialClick(e); }}>
          <circle cx={CX} cy={CY} r={R + DOT_R + 4} fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.08)" strokeWidth={1} />
          {step === "hour" ? (
            <>
              {outerHours.map(h => {
                const { x, y } = polarToXY(h, 12, R);
                const sel = selH === h;
                return (
                  <g key={h} onClick={e => { e.stopPropagation(); setSelH(h); setTimeout(() => setStep("minute"), 180); }}>
                    <circle cx={x} cy={y} r={DOT_R - 2} fill={sel ? "#1D9E75" : "rgba(255,255,255,.06)"} stroke={sel ? "#6ee7b7" : "rgba(255,255,255,.1)"} strokeWidth={1} />
                    <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fontSize={11} fontWeight={sel ? "600" : "400"} fill={sel ? "#fff" : "rgba(148,163,184,.8)"} style={{ userSelect: "none" }}>{h}</text>
                  </g>
                );
              })}
              {innerHours.map(h => {
                const { x, y } = polarToXY(h - 12, 12, R - 36);
                const sel = selH === h;
                return (
                  <g key={h} onClick={e => { e.stopPropagation(); setSelH(h); setTimeout(() => setStep("minute"), 180); }}>
                    <circle cx={x} cy={y} r={DOT_R - 6} fill={sel ? "#1D9E75" : "rgba(255,255,255,.04)"} stroke={sel ? "#6ee7b7" : "rgba(255,255,255,.07)"} strokeWidth={1} />
                    <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fontSize={10} fontWeight={sel ? "600" : "400"} fill={sel ? "#fff" : "rgba(148,163,184,.6)"} style={{ userSelect: "none" }}>{h}</text>
                  </g>
                );
              })}
            </>
          ) : (
            minutes.map(m => {
              const { x, y } = polarToXY(m, 60, R);
              const sel = selM === m;
              return (
                <g key={m} onClick={e => { e.stopPropagation(); setSelM(m); }}>
                  <circle cx={x} cy={y} r={DOT_R - 2} fill={sel ? "#1D9E75" : "rgba(255,255,255,.06)"} stroke={sel ? "#6ee7b7" : "rgba(255,255,255,.1)"} strokeWidth={1} />
                  <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fontSize={11} fontWeight={sel ? "600" : "400"} fill={sel ? "#fff" : "rgba(148,163,184,.8)"} style={{ userSelect: "none" }}>{String(m).padStart(2, "0")}</text>
                </g>
              );
            })
          )}
          <circle cx={CX} cy={CY} r={4} fill="rgba(110,231,183,.5)" />
        </svg>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button onClick={() => onConfirm(selH, selM)} style={{
            flex: 1, padding: 10, borderRadius: 10, border: "1px solid rgba(110,231,183,.3)",
            background: "rgba(110,231,183,.12)", color: "#6ee7b7", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>{t.setTime}</button>
          <button onClick={onClose} style={{
            padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,.08)",
            background: "rgba(255,255,255,.04)", color: "rgba(148,163,184,.6)", fontSize: 13, cursor: "pointer",
          }}>{t.cancel}</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Time Input
// ─────────────────────────────────────────────────────────────────────────────
function TimeInput({ value, onChange, t }) {
  const [mode, setMode] = useState("display");
  const [draft, setDraft] = useState("");
  const [showDial, setShowDial] = useState(false);

  const currentH = parseInt(value.split(":")[0], 10);
  const currentM = parseInt(value.split(":")[1], 10);

  const formatDraft = (digits) => {
    if (digits.length === 0) return "";
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, digits.length - 2)}:${digits.slice(-2)}`;
  };

  const commitKeyboard = () => {
    const d = draft.replace(/\D/g, "");
    let h = 0, m = 0;
    if (d.length <= 2) { h = Math.min(23, parseInt(d || "0", 10)); m = 0; }
    else { h = Math.min(23, parseInt(d.slice(0, d.length - 2), 10)); m = Math.min(59, parseInt(d.slice(-2), 10)); }
    if (!isNaN(h) && !isNaN(m)) onChange(h, m);
    setMode("display"); setDraft("");
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {mode === "keyboard" ? (
          <input
            value={formatDraft(draft)}
            onChange={e => setDraft(e.target.value.replace(/\D/g, "").slice(0, 4))}
            onBlur={commitKeyboard}
            onKeyDown={e => { if (e.key === "Enter") commitKeyboard(); if (e.key === "Escape") { setMode("display"); setDraft(""); } }}
            placeholder="HH:MM"
            style={{
              background: "rgba(255,255,255,.08)", border: "1px solid rgba(99,179,137,.5)",
              borderRadius: 6, color: "#f0fdf4", fontFamily: "'DM Mono', monospace",
              fontSize: 32, fontWeight: 300, width: 115, textAlign: "center",
              outline: "none", padding: "2px 4px", letterSpacing: "-1px",
              boxShadow: "0 0 0 3px rgba(99,179,137,.15)",
            }}
            autoFocus
          />
        ) : (
          <span
            onClick={() => { setDraft(""); setMode("keyboard"); }}
            title="Click to type time"
            style={{
              fontFamily: "'DM Mono', monospace", fontSize: 32, fontWeight: 300,
              letterSpacing: "-1px", color: "#f0fdf4", cursor: "text",
              borderBottom: "1px dashed rgba(255,255,255,.15)", paddingBottom: 1,
              transition: "border-color .15s",
            }}
            onMouseEnter={e => e.currentTarget.style.borderBottomColor = "rgba(99,179,137,.6)"}
            onMouseLeave={e => e.currentTarget.style.borderBottomColor = "rgba(255,255,255,.15)"}
          >{value}</span>
        )}
        <button onClick={() => setShowDial(true)} title="Open time picker"
          style={{
            background: "none", border: "1px solid rgba(255,255,255,.1)", borderRadius: 7,
            padding: 5, cursor: "pointer", color: "rgba(148,163,184,.4)",
            transition: "color .12s, border-color .12s, background .12s", display: "flex", alignItems: "center",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "#6ee7b7"; e.currentTarget.style.borderColor = "rgba(110,231,183,.35)"; e.currentTarget.style.background = "rgba(110,231,183,.08)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "rgba(148,163,184,.4)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.1)"; e.currentTarget.style.background = "none"; }}
          aria-label="Open clock dial picker"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
        </button>
      </div>
      {showDial && (
        <ClockDial
          initialH={currentH} initialM={currentM} t={t}
          onConfirm={(h, m) => { onChange(h, m); setShowDial(false); }}
          onClose={() => setShowDial(false)}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Search Dropdown
// ─────────────────────────────────────────────────────────────────────────────
function SearchDropdown({ onSelect, usedIds, onClose, t }) {
  const [q, setQ] = useState("");
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const filtered = TIMEZONE_DB.filter(z =>
    !usedIds.includes(z.id) &&
    (z.city.toLowerCase().includes(q.toLowerCase()) ||
      z.country.toLowerCase().includes(q.toLowerCase()))
  ).slice(0, 8);

  return (
    <div style={{
      position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, zIndex: 100,
      background: "rgba(15,23,42,.97)", backdropFilter: "blur(20px)",
      border: "1px solid rgba(255,255,255,.1)", borderRadius: 14,
      boxShadow: "0 20px 60px rgba(0,0,0,.6)", overflow: "hidden",
    }}>
      <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,.07)" }}>
        <input
          ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === "Escape" && onClose()}
          placeholder={t.searchPlaceholder}
          style={{
            width: "100%", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)",
            borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13, outline: "none",
          }}
        />
      </div>
      {filtered.length === 0 ? (
        <div style={{ padding: 16, color: "rgba(148,163,184,.5)", fontSize: 13, textAlign: "center" }}>{t.noResults}</div>
      ) : filtered.map(z => (
        <button key={z.id} onClick={() => { onSelect(z); onClose(); }}
          style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%",
            background: "none", border: "none", padding: "10px 14px", cursor: "pointer",
            textAlign: "left", color: "#e2e8f0", transition: "background .12s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.06)"}
          onMouseLeave={e => e.currentTarget.style.background = "none"}
        >
          <span style={{ fontSize: 20 }}>{z.flag}</span>
          <span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{z.city}</span>
            <span style={{ fontSize: 11, color: "rgba(148,163,184,.7)", marginLeft: 6 }}>{z.country}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Language Picker
// ─────────────────────────────────────────────────────────────────────────────
function LangPicker({ currentLang, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = LANGUAGES.find(l => l.code === currentLang);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(v => !v)} style={{
        display: "flex", alignItems: "center", gap: 6,
        background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)",
        borderRadius: 8, padding: "6px 12px", cursor: "pointer",
        color: "rgba(226,232,240,.8)", fontSize: 12, fontWeight: 500,
      }}>
        <span style={{ fontSize: 14 }}>{current?.flag}</span>
        <span>{current?.code.toUpperCase()}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 200,
          background: "rgba(15,23,42,.97)", border: "1px solid rgba(255,255,255,.1)",
          borderRadius: 12, overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,.5)",
          minWidth: 140,
        }}>
          {LANGUAGES.map(l => (
            <button key={l.code} onClick={() => { onChange(l.code); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%",
                background: l.code === currentLang ? "rgba(110,231,183,.08)" : "none",
                border: "none", padding: "9px 14px", cursor: "pointer",
                color: l.code === currentLang ? "#6ee7b7" : "#e2e8f0", fontSize: 13,
                textAlign: "left",
              }}
              onMouseEnter={e => { if (l.code !== currentLang) e.currentTarget.style.background = "rgba(255,255,255,.06)"; }}
              onMouseLeave={e => { if (l.code !== currentLang) e.currentTarget.style.background = "none"; }}
            >
              <span style={{ fontSize: 16 }}>{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Share Modal — encodes zones + pinned time in URL
// ─────────────────────────────────────────────────────────────────────────────
function ShareModal({ zoneIds, anchorDate, onClose, t }) {
  const hasPinnedTime = !!anchorDate;

  // Build URL: always include zones, include time (as UTC ms) if user pinned one
  const url = typeof window !== "undefined"
    ? (() => {
        const base = `${window.location.origin}/?zones=${zoneIds.join(",")}`;
        return hasPinnedTime
          ? `${base}&t=${anchorDate.getTime()}`
          : base;
      })()
    : "";

  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2500);
    });
  };

  // Format pinned time nicely for display
  const pinnedLabel = hasPinnedTime
    ? anchorDate.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC"
    : null;

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.6)",
      backdropFilter: "blur(6px)", display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 200, padding: "0 16px",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "rgba(15,23,42,.97)", border: "1px solid rgba(255,255,255,.1)",
        borderRadius: 18, padding: "24px 24px 20px", width: "100%", maxWidth: 400,
        boxShadow: "0 32px 80px rgba(0,0,0,.7)",
      }}>
        <h3 style={{ color: "#f1f5f9", fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
          {hasPinnedTime ? "📅 Share meeting time" : "🌍 Share Kairos"}
        </h3>

        {/* Show what's being shared */}
        <div style={{
          background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)",
          borderRadius: 10, padding: "12px 14px", marginBottom: 14,
        }}>
          <div style={{ fontSize: 12, color: "rgba(148,163,184,.5)", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 600 }}>
            {hasPinnedTime ? "Meeting details" : "Included in link"}
          </div>
          {/* Zones */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: hasPinnedTime ? 10 : 0 }}>
            {zoneIds.map(id => {
              const z = TIMEZONE_DB.find(z => z.id === id);
              return z ? (
                <span key={id} style={{
                  fontSize: 12, background: "rgba(255,255,255,.07)",
                  border: "1px solid rgba(255,255,255,.1)", borderRadius: 20,
                  padding: "3px 10px", color: "#e2e8f0",
                }}>{z.flag} {z.city}</span>
              ) : null;
            })}
          </div>
          {/* Pinned time */}
          {hasPinnedTime && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "rgba(110,231,183,.08)", border: "1px solid rgba(110,231,183,.2)",
              borderRadius: 8, padding: "8px 12px",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span style={{ fontSize: 12, color: "#6ee7b7", fontWeight: 500 }}>
                Pinned: {pinnedLabel}
              </span>
            </div>
          )}
          {!hasPinnedTime && (
            <p style={{ fontSize: 12, color: "rgba(148,163,184,.45)", marginTop: 8, lineHeight: 1.5, fontStyle: "italic" }}>
              💡 Tip: click any time first to pin a meeting time — recipients will see your exact proposed time in their timezone.
            </p>
          )}
        </div>

        {/* URL display */}
        <div style={{
          background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)",
          borderRadius: 8, padding: "9px 12px", fontSize: 11,
          color: "rgba(148,163,184,.6)", fontFamily: "monospace",
          wordBreak: "break-all", marginBottom: 14, lineHeight: 1.6,
        }}>{url}</div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={copy} style={{
            flex: 1, padding: "11px 10px", borderRadius: 10, cursor: "pointer",
            background: copied ? "rgba(99,179,137,.2)" : "rgba(99,179,137,.15)",
            color: copied ? "#6ee7b7" : "#86efac", fontSize: 14, fontWeight: 600,
            border: `1px solid ${copied ? "rgba(110,231,183,.4)" : "rgba(134,239,172,.2)"}`,
            transition: "all .15s",
          }}>{copied ? "✓ Copied!" : t.copyLink}</button>
          <button onClick={onClose} style={{
            padding: "11px 16px", borderRadius: 10, cursor: "pointer",
            background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)",
            color: "rgba(148,163,184,.7)", fontSize: 14,
          }}>{t.close}</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Zone Row
// ─────────────────────────────────────────────────────────────────────────────
function ZoneRow({ zone, timeStr, dateStr, utcOff, abbr, dst, isDay, onDelete, onTimeChange, t }) {
  return (
    <div style={{
      background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)",
      borderRadius: 14, padding: "12px 14px", marginBottom: 8,
      position: "relative", overflow: "hidden",
    }}>
      {/* left accent bar */}
      <div style={{
        position: "absolute", left: 0, top: "20%", bottom: "20%", width: 3,
        borderRadius: "0 3px 3px 0",
        background: isDay ? "linear-gradient(to bottom, #fbbf24, #f59e0b)" : "linear-gradient(to bottom, #6366f1, #4f46e5)",
        opacity: .7,
      }} />

      {/* Top row: flag + city + DELETE BUTTON */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, paddingLeft: 10 }}>
        <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0 }}>{zone.flag}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#f1f5f9", letterSpacing: "-.2px" }}>{zone.city}</span>
            <SunMoonIcon day={isDay} />
          </div>
          <div style={{ fontSize: 11, color: "rgba(148,163,184,.5)", marginTop: 1 }}>{zone.country}</div>
        </div>
        {/* Big mobile-friendly delete button */}
        <button
          onClick={onDelete}
          aria-label={`${t.remove} ${zone.city}`}
          style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: "rgba(248,113,113,.12)", border: "1px solid rgba(248,113,113,.25)",
            color: "#f87171", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background .15s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(248,113,113,.22)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(248,113,113,.12)"}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Bottom row: date/offset on left, time on right */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 10 }}>
        <div>
          <div style={{ fontSize: 12, color: "rgba(148,163,184,.7)", marginBottom: 3 }}>{dateStr}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, fontFamily: "monospace", fontWeight: 600, color: "rgba(148,163,184,.5)" }}>{utcOff}</span>
            <span style={{ fontSize: 10, color: "rgba(148,163,184,.4)", background: "rgba(255,255,255,.06)", borderRadius: 4, padding: "1px 5px" }}>{abbr}</span>
            {dst && <DSTBadge info={dst} t={t} />}
          </div>
        </div>
        <TimeInput value={timeStr} onChange={onTimeChange} t={t} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────────────────────────────────────
export default function WorldTimeApp() {
  const [zoneIds, setZoneIds] = useState(DEFAULT_ZONES);
  const [lang, setLang] = useState("en");
  const [now, setNow] = useState(new Date());
  const [anchorDate, setAnchorDate] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [draggingIdx, setDraggingIdx] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const searchRef = useRef(null);
  const dstCache = useRef({});

  const t = T[lang] || T.en;

  // Hydrate: URL params take priority, then localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlZones = params.get("zones");
    const urlTime = params.get("t");

    if (urlZones) {
      const ids = urlZones.split(",").map(s => s.trim().toLowerCase())
        .filter(id => TIMEZONE_DB.find(z => z.id === id));
      if (ids.length > 0) {
        setZoneIds(ids);
        // Restore pinned meeting time if present
        if (urlTime) {
          const ms = parseInt(urlTime, 10);
          if (!isNaN(ms)) setAnchorDate(new Date(ms));
        }
        const savedLang = loadSavedLang();
        if (savedLang) setLang(savedLang);
        else setLang(detectLanguage());
        setHydrated(true);
        return;
      }
    }
    const savedZones = loadSavedZones();
    const savedLang = loadSavedLang();
    if (savedZones) setZoneIds(savedZones);
    if (savedLang) setLang(savedLang);
    else setLang(detectLanguage());
    setHydrated(true);
  }, []);

  // Persist zones whenever they change
  useEffect(() => {
    if (hydrated) saveZones(zoneIds);
  }, [zoneIds, hydrated]);

  // Persist lang whenever it changes
  useEffect(() => {
    if (hydrated) saveLang(lang);
  }, [lang, hydrated]);

  // Live clock
  useEffect(() => {
    const id = setInterval(() => { if (!anchorDate) setNow(new Date()); }, 1000);
    return () => clearInterval(id);
  }, [anchorDate]);

  // Click-outside to close search
  useEffect(() => {
    const handler = e => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const displayDate = anchorDate || now;
  const zones = zoneIds.map(id => TIMEZONE_DB.find(z => z.id === id)).filter(Boolean);

  // DST cache
  zones.forEach(z => { if (!dstCache.current[z.id]) dstCache.current[z.id] = getDSTInfo(z.tz); });

  const removeZone = id => setZoneIds(prev => prev.filter(z => z !== id));
  const addZone = zone => setZoneIds(prev => [...prev, zone.id]);

  const handleTimeChange = (zoneObj, h, m) => {
    setAnchorDate(applyTimeDelta(displayDate, zoneObj.tz, h, m));
  };

  // Drag sort
  const dragIdx = useRef(null);
  const handleDragStart = useCallback(idx => { dragIdx.current = idx; setDraggingIdx(idx); }, []);
  const handleDragEnter = useCallback(idx => {
    if (dragIdx.current === null || dragIdx.current === idx) return;
    setZoneIds(prev => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx.current, 1);
      next.splice(idx, 0, moved);
      dragIdx.current = idx;
      return next;
    });
  }, []);
  const handleDragEnd = useCallback(() => { dragIdx.current = null; setDraggingIdx(null); }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(30,58,90,.6) 0%, transparent 70%), #080f1a",
      fontFamily: "'DM Sans', system-ui, sans-serif",
      paddingBottom: 60,
    }}>
      {/* Header */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px 24px 18px",
        borderBottom: "1px solid rgba(255,255,255,.05)",
        flexWrap: "wrap", gap: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "linear-gradient(135deg, rgba(99,179,137,.35), rgba(56,189,248,.2))",
            border: "1px solid rgba(99,179,137,.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-.4px" }}>{t.appName}</span>
              <span style={{
                fontSize: 9, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase",
                color: "#6ee7b7", background: "rgba(110,231,183,.1)", border: "1px solid rgba(110,231,183,.2)",
                borderRadius: 4, padding: "2px 6px",
              }}>{t.free}</span>
            </div>
            <div style={{ fontSize: 10, color: "rgba(148,163,184,.4)", marginTop: 1, letterSpacing: ".02em" }}>
              {t.tagline}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <LangPicker currentLang={lang} onChange={setLang} />
          {anchorDate && (
            <button onClick={() => setAnchorDate(null)} style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(251,191,36,.1)", border: "1px solid rgba(251,191,36,.25)",
              borderRadius: 8, padding: "6px 12px", cursor: "pointer",
              color: "#fbbf24", fontSize: 12, fontWeight: 500,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4.95" />
              </svg>
              {t.backToLive}
            </button>
          )}
          <button onClick={() => setShowShare(true)} style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)",
            borderRadius: 8, padding: "6px 14px", cursor: "pointer",
            color: "rgba(226,232,240,.8)", fontSize: 12, fontWeight: 500,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            {t.share}
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px 0" }}>

        {/* Live status + date toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
            background: anchorDate ? "#fbbf24" : "#4ade80",
            boxShadow: anchorDate ? "0 0 0 3px rgba(251,191,36,.2)" : "0 0 0 3px rgba(74,222,128,.2)",
          }} />
          <span style={{ fontSize: 12, color: "rgba(148,163,184,.6)", flex: 1 }}>
            {anchorDate
              ? `${t.previewing} — ${displayDate.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })} UTC`
              : t.live}
          </span>
          {/* Date toggle — only shown when a time is pinned */}
          {anchorDate && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: "rgba(148,163,184,.4)" }}>day:</span>
              <button
                onClick={() => setAnchorDate(new Date(anchorDate.getTime() - 86400000))}
                style={{
                  background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)",
                  borderRadius: 6, padding: "4px 10px", cursor: "pointer",
                  color: "rgba(226,232,240,.7)", fontSize: 12, fontWeight: 600,
                  transition: "background .12s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.12)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.06)"}
                title="Previous day"
              >{t.prevDay}</button>
              <span style={{
                fontSize: 12, fontWeight: 600, color: "#f1f5f9",
                background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)",
                borderRadius: 6, padding: "4px 10px", minWidth: 90, textAlign: "center",
              }}>
                {displayDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
              </span>
              <button
                onClick={() => setAnchorDate(new Date(anchorDate.getTime() + 86400000))}
                style={{
                  background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)",
                  borderRadius: 6, padding: "4px 10px", cursor: "pointer",
                  color: "rgba(226,232,240,.7)", fontSize: 12, fontWeight: 600,
                  transition: "background .12s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.12)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.06)"}
                title="Next day"
              >{t.nextDay}</button>
            </div>
          )}
        </div>

        {/* Zone rows */}
        {zones.map((zone, idx) => {
          const timeStr = getTimeInZone(zone.tz, displayDate);
          const [h, m] = timeStr.split(":").map(Number);
          const displayTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
          return (
            <div key={zone.id} draggable
              onDragStart={() => handleDragStart(idx)}
              onDragEnter={() => handleDragEnter(idx)}
              onDragEnd={handleDragEnd}
              onDragOver={e => e.preventDefault()}
              style={{ opacity: draggingIdx === idx ? 0.5 : 1, transition: "opacity .15s" }}
            >
              <ZoneRow
                zone={zone}
                timeStr={displayTime}
                dateStr={getDateInZone(zone.tz, displayDate)}
                utcOff={getUTCOffset(zone.tz, displayDate)}
                abbr={getAbbr(zone.tz, displayDate)}
                dst={dstCache.current[zone.id]}
                isDay={isDaytime(zone.tz, displayDate)}
                t={t}
                onDelete={() => removeZone(zone.id)}
                onTimeChange={(h, m) => handleTimeChange(zone, h, m)}
              />
            </div>
          );
        })}

        {/* Add zone */}
        <div ref={searchRef} style={{ position: "relative", marginTop: 4 }}>
          <button onClick={() => setShowSearch(v => !v)} style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%",
            background: "rgba(255,255,255,.03)",
            border: `1px dashed ${showSearch ? "rgba(99,179,137,.4)" : "rgba(255,255,255,.1)"}`,
            borderRadius: 14, padding: "14px 18px", cursor: "pointer",
            color: showSearch ? "#86efac" : "rgba(148,163,184,.4)",
            fontSize: 13, fontWeight: 500, transition: "border-color .15s, color .15s",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            {t.addZone}
          </button>
          {showSearch && (
            <SearchDropdown
              onSelect={addZone} usedIds={zoneIds}
              onClose={() => setShowSearch(false)} t={t}
            />
          )}
        </div>

        {/* DST panel */}
        {zones.some(z => dstCache.current[z.id]) && (
          <div style={{
            marginTop: 24, background: "rgba(234,179,8,.06)",
            border: "1px solid rgba(234,179,8,.15)", borderRadius: 12, padding: "14px 18px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#f59e0b" }}>{t.dstUpcoming}</span>
            </div>
            {zones.filter(z => dstCache.current[z.id]).map(zone => {
              const dst = dstCache.current[zone.id];
              return (
                <div key={zone.id} style={{
                  display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
                  fontSize: 12, color: "rgba(148,163,184,.7)", marginBottom: 5,
                }}>
                  <span>{zone.flag}</span>
                  <span style={{ color: "#fcd34d", fontWeight: 500 }}>{zone.city}</span>
                  <span>{t.clocksMove}</span>
                  <span style={{ color: dst.direction === "forward" ? "#86efac" : "#f87171", fontWeight: 600 }}>
                    {dst.direction === "forward" ? t.forward : t.back}
                  </span>
                  <span>{t.in} <b style={{ color: "#fcd34d" }}>{dst.days}</b> {dst.days === 1 ? t.dstDay : t.dstDays}</span>
                  <span style={{ color: "rgba(148,163,184,.4)" }}>({dst.from} → {dst.to})</span>
                </div>
              );
            })}
          </div>
        )}

        <p style={{ textAlign: "center", fontSize: 11, color: "rgba(148,163,184,.25)", marginTop: 32, lineHeight: 1.7 }}>
          {t.hint} · Use − day / + day to shift the date
        </p>
      </main>

      {showShare && <ShareModal zoneIds={zoneIds} anchorDate={anchorDate} onClose={() => setShowShare(false)} t={t} />}
    </div>
  );
}
