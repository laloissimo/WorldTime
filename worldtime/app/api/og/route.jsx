import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TIMEZONE_DB = [
  { id: "berlin",      city: "Berlin",       country: "Germany",       flag: "🇩🇪", tz: "Europe/Berlin"       },
  { id: "london",      city: "London",       country: "UK",            flag: "🇬🇧", tz: "Europe/London"       },
  { id: "paris",       city: "Paris",        country: "France",        flag: "🇫🇷", tz: "Europe/Paris"        },
  { id: "newyork",     city: "New York",     country: "USA",           flag: "🇺🇸", tz: "America/New_York"    },
  { id: "losangeles",  city: "Los Angeles",  country: "USA",           flag: "🇺🇸", tz: "America/Los_Angeles" },
  { id: "chicago",     city: "Chicago",      country: "USA",           flag: "🇺🇸", tz: "America/Chicago"     },
  { id: "vancouver",   city: "Vancouver",    country: "Canada",        flag: "🇨🇦", tz: "America/Vancouver"   },
  { id: "toronto",     city: "Toronto",      country: "Canada",        flag: "🇨🇦", tz: "America/Toronto"     },
  { id: "brasilia",    city: "Brasília",     country: "Brazil",        flag: "🇧🇷", tz: "America/Sao_Paulo"   },
  { id: "melbourne",   city: "Melbourne",    country: "Australia",     flag: "🇦🇺", tz: "Australia/Melbourne" },
  { id: "sydney",      city: "Sydney",       country: "Australia",     flag: "🇦🇺", tz: "Australia/Sydney"    },
  { id: "tokyo",       city: "Tokyo",        country: "Japan",         flag: "🇯🇵", tz: "Asia/Tokyo"          },
  { id: "shanghai",    city: "Shanghai",     country: "China",         flag: "🇨🇳", tz: "Asia/Shanghai"       },
  { id: "dubai",       city: "Dubai",        country: "UAE",           flag: "🇦🇪", tz: "Asia/Dubai"          },
  { id: "mumbai",      city: "Mumbai",       country: "India",         flag: "🇮🇳", tz: "Asia/Kolkata"        },
  { id: "singapore",   city: "Singapore",    country: "Singapore",     flag: "🇸🇬", tz: "Asia/Singapore"      },
  { id: "seoul",       city: "Seoul",        country: "South Korea",   flag: "🇰🇷", tz: "Asia/Seoul"          },
  { id: "moscow",      city: "Moscow",       country: "Russia",        flag: "🇷🇺", tz: "Europe/Moscow"       },
  { id: "johannesburg",city: "Johannesburg", country: "South Africa",  flag: "🇿🇦", tz: "Africa/Johannesburg" },
  { id: "cairo",       city: "Cairo",        country: "Egypt",         flag: "🇪🇬", tz: "Africa/Cairo"        },
  { id: "istanbul",    city: "Istanbul",     country: "Turkey",        flag: "🇹🇷", tz: "Europe/Istanbul"     },
  { id: "amsterdam",   city: "Amsterdam",    country: "Netherlands",   flag: "🇳🇱", tz: "Europe/Amsterdam"    },
  { id: "madrid",      city: "Madrid",       country: "Spain",         flag: "🇪🇸", tz: "Europe/Madrid"       },
  { id: "rome",        city: "Rome",         country: "Italy",         flag: "🇮🇹", tz: "Europe/Rome"         },
  { id: "stockholm",   city: "Stockholm",    country: "Sweden",        flag: "🇸🇪", tz: "Europe/Stockholm"    },
  { id: "zurich",      city: "Zurich",       country: "Switzerland",   flag: "🇨🇭", tz: "Europe/Zurich"       },
  { id: "auckland",    city: "Auckland",     country: "New Zealand",   flag: "🇳🇿", tz: "Pacific/Auckland"    },
  { id: "honolulu",    city: "Honolulu",     country: "USA",           flag: "🇺🇸", tz: "Pacific/Honolulu"    },
  { id: "mexico",      city: "Mexico City",  country: "Mexico",        flag: "🇲🇽", tz: "America/Mexico_City" },
  { id: "bogota",      city: "Bogotá",       country: "Colombia",      flag: "🇨🇴", tz: "America/Bogota"      },
];

function getTimeInZone(tz, date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(date);
}

function getDateInZone(tz, date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz, weekday: "short", day: "numeric", month: "short",
  }).format(date);
}

function isNextDay(baseTz, targetTz, date) {
  const baseDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: baseTz, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(date);
  const targetDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: targetTz, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(date);
  return targetDate > baseDate ? "+1" : targetDate < baseDate ? "-1" : null;
}

export default async function GET(request) {
  const { searchParams } = new URL(request.url);
  const zonesParam = searchParams.get("zones") || "berlin,brasilia,melbourne,vancouver";
  const timeParam = searchParams.get("t");

  const date = timeParam ? new Date(parseInt(timeParam, 10)) : new Date();
  const hasPinnedTime = !!timeParam;

  const zoneIds = zonesParam.split(",").slice(0, 4);
  const zones = zoneIds
    .map(id => TIMEZONE_DB.find(z => z.id === id.trim()))
    .filter(Boolean);

  const firstZone = zones[0];

  // Accent colors per zone position
  const accentColors = ["#6ee7b7", "#67e8f9", "#a5b4fc", "#fca5a5"];

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          background: "#080f1a",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background radial glow */}
        <div style={{
          position: "absolute", top: -100, left: -100,
          width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(30,58,90,0.8) 0%, transparent 70%)",
          display: "flex",
        }} />
        <div style={{
          position: "absolute", bottom: -150, right: -100,
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(15,40,70,0.6) 0%, transparent 70%)",
          display: "flex",
        }} />

        {/* Top grid lines decoration */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: "linear-gradient(90deg, transparent, rgba(110,231,183,0.4), transparent)",
          display: "flex",
        }} />

        {/* Main content */}
        <div style={{
          display: "flex", flexDirection: "column",
          padding: "52px 72px", flex: 1, position: "relative",
        }}>

          {/* Header row — logo + app name + tagline */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 48 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: "linear-gradient(135deg, rgba(99,179,137,0.3), rgba(56,189,248,0.2))",
              border: "1.5px solid rgba(99,179,137,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24,
            }}>⏱</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{
                fontSize: 28, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.5px",
              }}>Kairos</span>
              <span style={{ fontSize: 14, color: "rgba(110,231,183,0.7)", marginTop: 2 }}>
                Time without borders
              </span>
            </div>
            {hasPinnedTime && (
              <div style={{
                marginLeft: "auto",
                display: "flex", alignItems: "center", gap: 8,
                background: "rgba(110,231,183,0.1)",
                border: "1px solid rgba(110,231,183,0.25)",
                borderRadius: 24, padding: "8px 20px",
              }}>
                <span style={{ fontSize: 16 }}>📅</span>
                <span style={{ fontSize: 16, color: "#6ee7b7", fontWeight: 600 }}>
                  Meeting time
                </span>
              </div>
            )}
            {!hasPinnedTime && (
              <div style={{
                marginLeft: "auto",
                display: "flex", alignItems: "center", gap: 8,
                background: "rgba(99,102,241,0.1)",
                border: "1px solid rgba(99,102,241,0.25)",
                borderRadius: 24, padding: "8px 20px",
              }}>
                <span style={{ fontSize: 14, color: "#a5b4fc", fontWeight: 600 }}>
                  🌍  Find the perfect moment, everywhere
                </span>
              </div>
            )}
          </div>

          {/* Zone rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
            {zones.map((zone, i) => {
              const timeStr = getTimeInZone(zone.tz, date);
              const dateStr = getDateInZone(zone.tz, date);
              const dayTag = firstZone ? isNextDay(firstZone.tz, zone.tz, date) : null;
              const accent = accentColors[i] || "#6ee7b7";
              const h = parseInt(timeStr.split(":")[0], 10);
              const isNight = h < 6 || h >= 21;

              return (
                <div key={zone.id} style={{
                  display: "flex", alignItems: "center",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  padding: "18px 28px",
                  position: "relative",
                  overflow: "hidden",
                }}>
                  {/* Left accent */}
                  <div style={{
                    position: "absolute", left: 0, top: "15%", bottom: "15%",
                    width: 4, borderRadius: "0 4px 4px 0",
                    background: isNight
                      ? "linear-gradient(to bottom, #6366f1, #4f46e5)"
                      : "linear-gradient(to bottom, #fbbf24, #f59e0b)",
                    display: "flex",
                  }} />

                  {/* Flag */}
                  <span style={{ fontSize: 40, marginRight: 20, lineHeight: 1 }}>
                    {zone.flag}
                  </span>

                  {/* City + country */}
                  <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                    <span style={{
                      fontSize: 22, fontWeight: 700, color: "#f1f5f9",
                      letterSpacing: "-0.3px",
                    }}>{zone.city}</span>
                    <span style={{ fontSize: 14, color: "rgba(148,163,184,0.55)", marginTop: 2 }}>
                      {zone.country} · {dateStr}
                    </span>
                  </div>

                  {/* Day tag if different day */}
                  {dayTag && (
                    <div style={{
                      background: dayTag === "+1" ? "rgba(110,231,183,0.12)" : "rgba(248,113,113,0.12)",
                      border: `1px solid ${dayTag === "+1" ? "rgba(110,231,183,0.3)" : "rgba(248,113,113,0.3)"}`,
                      borderRadius: 8, padding: "4px 10px",
                      fontSize: 13, fontWeight: 700,
                      color: dayTag === "+1" ? "#6ee7b7" : "#f87171",
                      marginRight: 20,
                    }}>{dayTag === "+1" ? "next day" : "prev day"}</div>
                  )}

                  {/* Time */}
                  <span style={{
                    fontSize: 44, fontWeight: 300, color: "#f0fdf4",
                    letterSpacing: "-2px", fontFamily: "monospace",
                  }}>{timeStr}</span>
                </div>
              );
            })}
          </div>

          {/* Bottom bar */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginTop: 28, paddingTop: 20,
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}>
            <span style={{ fontSize: 13, color: "rgba(148,163,184,0.3)", letterSpacing: "0.05em" }}>
              kairos.vercel.app
            </span>
            <span style={{ fontSize: 13, color: "rgba(148,163,184,0.3)" }}>
              {hasPinnedTime ? "Tap to open in your timezone" : "Tap to compare live times"}
            </span>
          </div>

        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
