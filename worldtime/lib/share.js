// Shared by the page metadata and the /api/og image so both always agree.
import { TIMEZONE_DB } from "./timezones";

export const SITE_URL = "https://kairoszone.app";
export const MAX_SHARE_ZONES = 5;

// ISO country code per zone id, used to pick the bundled flag artwork.
export const ZONE_COUNTRY = {
  berlin: "DE", london: "GB", paris: "FR", newyork: "US", losangeles: "US",
  chicago: "US", vancouver: "CA", toronto: "CA", brasilia: "BR", melbourne: "AU",
  sydney: "AU", tokyo: "JP", shanghai: "CN", dubai: "AE", mumbai: "IN",
  singapore: "SG", seoul: "KR", moscow: "RU", johannesburg: "ZA", cairo: "EG",
  istanbul: "TR", amsterdam: "NL", madrid: "ES", rome: "IT", stockholm: "SE",
  zurich: "CH", auckland: "NZ", honolulu: "US", mexico: "MX", bogota: "CO",
};

const DEFAULT_SHARE_ZONES = ["berlin", "brasilia", "melbourne", "vancouver", "toronto"];

function first(value) {
  return Array.isArray(value) ? value[0] : value;
}

function parts(tz, date, options) {
  const out = {};
  for (const p of new Intl.DateTimeFormat("en-GB", { timeZone: tz, ...options }).formatToParts(date)) {
    out[p.type] = p.value;
  }
  return out;
}

function offsetLabel(tz, date) {
  const p = parts(tz, date, { timeZoneName: "shortOffset" });
  const raw = (p.timeZoneName || "GMT").replace("GMT", "UTC");
  return raw === "UTC" ? "UTC+0" : raw;
}

// Reads ?zones=a,b,c&t=<epoch ms> and returns everything a preview needs.
export function parseShare(zonesParam, tParam) {
  const ids = String(first(zonesParam) || "")
    .split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  const seen = new Set();
  let zones = ids
    .filter(id => !seen.has(id) && seen.add(id))
    .map(id => TIMEZONE_DB.find(z => z.id === id))
    .filter(Boolean);
  if (zones.length === 0) {
    zones = DEFAULT_SHARE_ZONES.map(id => TIMEZONE_DB.find(z => z.id === id));
  }

  const ms = Number.parseInt(first(tParam), 10);
  const pinned = Number.isFinite(ms) && ms > 0 && ms < 8.64e15;
  const date = pinned ? new Date(ms) : new Date();

  const baseDay = parts(zones[0].tz, date, { year: "numeric", month: "2-digit", day: "2-digit" });
  const baseKey = `${baseDay.year}${baseDay.month}${baseDay.day}`;

  const rows = zones.map(zone => {
    const t = parts(zone.tz, date, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
    const d = parts(zone.tz, date, { weekday: "short", day: "numeric", month: "short" });
    const k = parts(zone.tz, date, { year: "numeric", month: "2-digit", day: "2-digit" });
    const key = `${k.year}${k.month}${k.day}`;
    const hour = Number.parseInt(t.hour, 10);
    return {
      id: zone.id,
      city: zone.city,
      cc: ZONE_COUNTRY[zone.id],
      time: `${t.hour}:${t.minute}`,
      dateLabel: `${d.weekday} ${d.day} ${d.month}`,
      dayShift: key > baseKey ? 1 : key < baseKey ? -1 : 0,
      isDay: hour >= 6 && hour < 21,
      offset: offsetLabel(zone.tz, date),
    };
  });

  const query = `zones=${rows.map(r => r.id).join(",")}${pinned ? `&t=${ms}` : ""}`;
  return { rows, pinned, ms: pinned ? ms : null, query };
}

// Plain-text version of the card, so the times are readable even where an
// app shows only the title and description and no image.
export function shareText({ rows, pinned }) {
  const shown = rows.slice(0, MAX_SHARE_ZONES);
  const cities = shown.map(r => r.city).join(" · ");
  if (!pinned) {
    return {
      title: `Kairos — ${cities}`,
      description: "Live times side by side. Time without borders — find the perfect moment, everywhere.",
    };
  }
  const mark = r => (r.dayShift > 0 ? " (+1 day)" : r.dayShift < 0 ? " (−1 day)" : "");
  return {
    title: `${shown[0].dateLabel} — ${shown.map(r => `${r.city} ${r.time}${mark(r)}`).join(" · ")}`,
    description: `${shown.map(r => `${r.city}: ${r.dateLabel}, ${r.time}`).join(" | ")}. Open to see it in your own time zone.`,
  };
}
