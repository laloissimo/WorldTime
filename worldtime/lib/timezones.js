export const TIMEZONE_DB = [
  { id: "berlin",      city: "Berlin",       country: "Germany",       flag: "🇩🇪", tz: "Europe/Berlin"        },
  { id: "london",      city: "London",       country: "UK",            flag: "🇬🇧", tz: "Europe/London"        },
  { id: "paris",       city: "Paris",        country: "France",        flag: "🇫🇷", tz: "Europe/Paris"         },
  { id: "newyork",     city: "New York",     country: "USA",           flag: "🇺🇸", tz: "America/New_York"     },
  { id: "losangeles",  city: "Los Angeles",  country: "USA",           flag: "🇺🇸", tz: "America/Los_Angeles"  },
  { id: "chicago",     city: "Chicago",      country: "USA",           flag: "🇺🇸", tz: "America/Chicago"      },
  { id: "vancouver",   city: "Vancouver",    country: "Canada",        flag: "🇨🇦", tz: "America/Vancouver"    },
  { id: "toronto",     city: "Toronto",      country: "Canada",        flag: "🇨🇦", tz: "America/Toronto"      },
  { id: "brasilia",    city: "Brasília",     country: "Brazil",        flag: "🇧🇷", tz: "America/Sao_Paulo"    },
  { id: "melbourne",   city: "Melbourne",    country: "Australia",     flag: "🇦🇺", tz: "Australia/Melbourne"  },
  { id: "sydney",      city: "Sydney",       country: "Australia",     flag: "🇦🇺", tz: "Australia/Sydney"     },
  { id: "tokyo",       city: "Tokyo",        country: "Japan",         flag: "🇯🇵", tz: "Asia/Tokyo"           },
  { id: "shanghai",    city: "Shanghai",     country: "China",         flag: "🇨🇳", tz: "Asia/Shanghai"        },
  { id: "dubai",       city: "Dubai",        country: "UAE",           flag: "🇦🇪", tz: "Asia/Dubai"           },
  { id: "mumbai",      city: "Mumbai",       country: "India",         flag: "🇮🇳", tz: "Asia/Kolkata"         },
  { id: "singapore",   city: "Singapore",    country: "Singapore",     flag: "🇸🇬", tz: "Asia/Singapore"       },
  { id: "seoul",       city: "Seoul",        country: "South Korea",   flag: "🇰🇷", tz: "Asia/Seoul"           },
  { id: "moscow",      city: "Moscow",       country: "Russia",        flag: "🇷🇺", tz: "Europe/Moscow"        },
  { id: "johannesburg",city: "Johannesburg", country: "South Africa",  flag: "🇿🇦", tz: "Africa/Johannesburg"  },
  { id: "cairo",       city: "Cairo",        country: "Egypt",         flag: "🇪🇬", tz: "Africa/Cairo"         },
  { id: "istanbul",    city: "Istanbul",     country: "Turkey",        flag: "🇹🇷", tz: "Europe/Istanbul"      },
  { id: "amsterdam",   city: "Amsterdam",    country: "Netherlands",   flag: "🇳🇱", tz: "Europe/Amsterdam"     },
  { id: "madrid",      city: "Madrid",       country: "Spain",         flag: "🇪🇸", tz: "Europe/Madrid"        },
  { id: "rome",        city: "Rome",         country: "Italy",         flag: "🇮🇹", tz: "Europe/Rome"          },
  { id: "stockholm",   city: "Stockholm",    country: "Sweden",        flag: "🇸🇪", tz: "Europe/Stockholm"     },
  { id: "zurich",      city: "Zurich",       country: "Switzerland",   flag: "🇨🇭", tz: "Europe/Zurich"        },
  { id: "auckland",    city: "Auckland",     country: "New Zealand",   flag: "🇳🇿", tz: "Pacific/Auckland"     },
  { id: "honolulu",    city: "Honolulu",     country: "USA",           flag: "🇺🇸", tz: "Pacific/Honolulu"     },
  { id: "mexico",      city: "Mexico City",  country: "Mexico",        flag: "🇲🇽", tz: "America/Mexico_City"  },
  { id: "bogota",      city: "Bogotá",       country: "Colombia",      flag: "🇨🇴", tz: "America/Bogota"       },
];

export const DEFAULT_ZONES = ["berlin", "newyork", "tokyo", "sydney"];

export function getTimeInZone(tz, date = new Date()) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).format(date);
}

export function getDateInZone(tz, date = new Date()) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz, weekday: "short", month: "short", day: "numeric",
  }).format(date);
}

export function getUTCOffset(tz, date = new Date()) {
  const fmt = new Intl.DateTimeFormat("en", { timeZone: tz, timeZoneName: "shortOffset" });
  const parts = fmt.formatToParts(date);
  return (parts.find(p => p.type === "timeZoneName")?.value || "").replace("GMT", "UTC");
}

export function getAbbr(tz, date = new Date()) {
  const fmt = new Intl.DateTimeFormat("en", { timeZone: tz, timeZoneName: "short" });
  const parts = fmt.formatToParts(date);
  return parts.find(p => p.type === "timeZoneName")?.value || "";
}

export function getDSTInfo(tz) {
  const now = new Date();
  for (let d = 1; d <= 90; d++) {
    const a = new Date(now.getTime() + (d - 1) * 86400000);
    const b = new Date(now.getTime() + d * 86400000);
    const offA = getUTCOffset(tz, a);
    const offB = getUTCOffset(tz, b);
    if (offA !== offB) {
      return { days: d, direction: offB > offA ? "forward" : "back", from: offA, to: offB };
    }
  }
  return null;
}

export function isDaytime(tz, date = new Date()) {
  const h = parseInt(getTimeInZone(tz, date).split(":")[0], 10);
  return h >= 6 && h < 21;
}

export function applyTimeDelta(baseDate, fromTz, inputH, inputM) {
  const dateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: fromTz, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(baseDate);
  const [y, mo, d] = dateStr.split("-").map(Number);
  const isoLike = `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}T${String(inputH).padStart(2, "0")}:${String(inputM).padStart(2, "0")}:00`;
  const offsetStr = getUTCOffset(fromTz, baseDate);
  const match = offsetStr.match(/UTC([+-])(\d+)(?::(\d+))?/);
  if (!match) return baseDate;
  const sign = match[1] === "+" ? -1 : 1;
  const oh = parseInt(match[2], 10);
  const om = parseInt(match[3] || "0", 10);
  const totalOffset = sign * (oh * 60 + om);
  return new Date(new Date(isoLike + "Z").getTime() + totalOffset * 60000);
}

// localStorage persistence keys
const STORAGE_KEY_ZONES = "wt_zones";
const STORAGE_KEY_LANG  = "wt_lang";

export function loadSavedZones() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ZONES);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Validate all ids exist in DB
    const valid = parsed.filter(id => TIMEZONE_DB.find(z => z.id === id));
    return valid.length >= 1 ? valid : null;
  } catch { return null; }
}

export function saveZones(zoneIds) {
  try { localStorage.setItem(STORAGE_KEY_ZONES, JSON.stringify(zoneIds)); } catch {}
}

export function loadSavedLang() {
  try { return localStorage.getItem(STORAGE_KEY_LANG) || null; } catch { return null; }
}

export function saveLang(lang) {
  try { localStorage.setItem(STORAGE_KEY_LANG, lang); } catch {}
}
