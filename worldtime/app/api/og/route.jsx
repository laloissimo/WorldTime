import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  AE, AU, BR, CA, CH, CN, CO, DE, EG, ES, FR, GB, IN, IT, JP, KR, MX, NL, NZ,
  RU, SE, SG, TR, US, ZA,
} from "country-flag-icons/string/3x2";
import { parseShare, MAX_SHARE_ZONES } from "../../../lib/share";

// Node runtime on purpose: it shares its time zone database with the page
// itself, so the picture and the page can never disagree about a clock.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FLAGS = {
  AE, AU, BR, CA, CH, CN, CO, DE, EG, ES, FR, GB, IN, IT, JP, KR, MX, NL, NZ,
  RU, SE, SG, TR, US, ZA,
};

const W = 1200;
const H = 630;

const C = {
  bg: "#080f1a",
  row: "#111b2b",
  rowBorder: "#1c293c",
  text: "#f1f5f9",
  time: "#f0fdf4",
  muted: "#8a99ae",
  accent: "#6ee7b7",
  day: "#fbbf24",
  night: "#6366f1",
  warn: "#fbbf24",
};

// Fonts ship inside the project, so rendering needs no network at all.
let fontsPromise;
function loadFonts() {
  if (!fontsPromise) {
    const dir = join(process.cwd(), "assets", "fonts");
    fontsPromise = Promise.all([
      readFile(join(dir, "dm-sans-latin-500-normal.woff")),
      readFile(join(dir, "dm-sans-latin-700-normal.woff")),
      readFile(join(dir, "dm-mono-latin-400-normal.woff")),
    ]).then(([sans500, sans700, mono400]) => [
      { name: "DM Sans", data: sans500, weight: 500, style: "normal" },
      { name: "DM Sans", data: sans700, weight: 700, style: "normal" },
      { name: "DM Mono", data: mono400, weight: 400, style: "normal" },
    ]).catch(() => undefined); // fall back to the built-in font
  }
  return fontsPromise;
}

function flagSrc(cc) {
  const svg = FLAGS[cc];
  return svg ? `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}` : null;
}

function ClockMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9.5" stroke={C.accent} strokeWidth="2" />
      <path d="M12 6.5V12l3.6 2.2" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Type sizes step down as rows are added so five zones still read clearly
// at the size a chat app shows the picture.
const SCALE = {
  1: { row: 150, gap: 0, city: 60, time: 104, date: 30, flagW: 96 },
  2: { row: 150, gap: 22, city: 56, time: 100, date: 28, flagW: 90 },
  3: { row: 132, gap: 18, city: 52, time: 92, date: 26, flagW: 84 },
  4: { row: 104, gap: 14, city: 46, time: 78, date: 24, flagW: 72 },
  5: { row: 84, gap: 11, city: 40, time: 66, date: 22, flagW: 60 },
};

function Row({ r, s, pinned }) {
  const src = flagSrc(r.cc);
  const flagH = Math.round((s.flagW * 2) / 3);
  const shifted = r.dayShift !== 0;
  return (
    <div style={{
      display: "flex", alignItems: "center", height: s.row,
      background: C.row, border: `2px solid ${C.rowBorder}`, borderRadius: 20,
      paddingLeft: 30, paddingRight: 34, position: "relative",
    }}>
      <div style={{
        display: "flex", position: "absolute", left: 0,
        top: Math.round(s.row * 0.2), width: 7, height: Math.round(s.row * 0.6),
        borderRadius: 4, background: pinned ? (r.isDay ? C.day : C.night) : C.accent,
      }} />
      {src ? (
        <img src={src} width={s.flagW} height={flagH} style={{ borderRadius: 7, marginRight: 26 }} />
      ) : null}
      <div style={{
        display: "flex", flex: 1, fontFamily: "DM Sans", fontWeight: 700,
        fontSize: s.city, color: C.text, letterSpacing: -1,
      }}>{r.city}</div>
      {pinned ? (
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{
            display: "flex", fontFamily: "DM Sans", fontWeight: shifted ? 700 : 500,
            fontSize: s.date, color: shifted ? C.warn : C.muted, marginRight: 30,
          }}>{r.dateLabel}</div>
          <div style={{
            display: "flex", fontFamily: "DM Mono", fontWeight: 400,
            fontSize: s.time, color: C.time, letterSpacing: -2,
          }}>{r.time}</div>
        </div>
      ) : (
        <div style={{
          display: "flex", fontFamily: "DM Mono", fontWeight: 400,
          fontSize: Math.round(s.time * 0.6), color: C.muted,
        }}>{r.offset}</div>
      )}
    </div>
  );
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const share = parseShare(searchParams.get("zones"), searchParams.get("t"));
  const rows = share.rows.slice(0, MAX_SHARE_ZONES);
  const extra = share.rows.length - rows.length;
  const s = SCALE[rows.length];
  const fonts = await loadFonts();

  const image = new ImageResponse(
    (
      <div style={{
        width: W, height: H, display: "flex", flexDirection: "column",
        background: C.bg, padding: "36px 48px 0 48px", fontFamily: "DM Sans",
      }}>
        <div style={{ display: "flex", alignItems: "center", height: 62 }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 58, height: 58, borderRadius: 16,
            background: "#12313a", border: "2px solid #2b6f63",
          }}>
            <ClockMark />
          </div>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: C.text, marginLeft: 18, letterSpacing: -1 }}>
            Kairos
          </div>
          <div style={{ display: "flex", fontSize: 24, fontWeight: 500, color: C.accent, marginLeft: 18, marginTop: 8 }}>
            Time without borders
          </div>
          <div style={{ display: "flex", flex: 1 }} />
          <div style={{ display: "flex", fontSize: 24, fontWeight: 500, color: C.muted, marginTop: 8 }}>
            {share.pinned
              ? (extra > 0 ? `+${extra} more on kairoszone.app` : "kairoszone.app")
              : "Find the perfect moment, everywhere"}
          </div>
        </div>

        <div style={{
          display: "flex", flexDirection: "column", justifyContent: "center",
          flex: 1, paddingBottom: 30,
        }}>
          {rows.map((r, i) => (
            <div key={r.id} style={{ display: "flex", flexDirection: "column", marginTop: i === 0 ? 0 : s.gap }}>
              <Row r={r} s={s} pinned={share.pinned} />
            </div>
          ))}
        </div>
      </div>
    ),
    { width: W, height: H, fonts },
  );

  // A pinned time never changes, so its picture can be cached for good.
  // A live view only shows cities and offsets; refresh it daily.
  image.headers.set(
    "Cache-Control",
    share.pinned
      ? "public, max-age=31536000, s-maxage=31536000, immutable"
      : "public, max-age=3600, s-maxage=86400",
  );
  return image;
}
