import WorldTimeApp from "../components/WorldTimeApp";

// This runs on the SERVER — reads URL params and generates
// the correct OG image URL for each unique share link
export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const zones = params?.zones || "berlin,brasilia,melbourne,vancouver";
  const t = params?.t || "";

  const ogUrl = `/api/og?zones=${zones}${t ? `&t=${t}` : ""}`;

  // Build a readable title from the zone names
  const TIMEZONE_DB = [
    { id: "berlin", city: "Berlin" }, { id: "london", city: "London" },
    { id: "paris", city: "Paris" }, { id: "newyork", city: "New York" },
    { id: "losangeles", city: "Los Angeles" }, { id: "chicago", city: "Chicago" },
    { id: "vancouver", city: "Vancouver" }, { id: "toronto", city: "Toronto" },
    { id: "brasilia", city: "Brasília" }, { id: "melbourne", city: "Melbourne" },
    { id: "sydney", city: "Sydney" }, { id: "tokyo", city: "Tokyo" },
    { id: "shanghai", city: "Shanghai" }, { id: "dubai", city: "Dubai" },
    { id: "mumbai", city: "Mumbai" }, { id: "singapore", city: "Singapore" },
    { id: "seoul", city: "Seoul" }, { id: "moscow", city: "Moscow" },
    { id: "johannesburg", city: "Johannesburg" }, { id: "cairo", city: "Cairo" },
    { id: "istanbul", city: "Istanbul" }, { id: "amsterdam", city: "Amsterdam" },
    { id: "madrid", city: "Madrid" }, { id: "rome", city: "Rome" },
    { id: "stockholm", city: "Stockholm" }, { id: "zurich", city: "Zurich" },
    { id: "auckland", city: "Auckland" }, { id: "honolulu", city: "Honolulu" },
    { id: "mexico", city: "Mexico City" }, { id: "bogota", city: "Bogotá" },
  ];

  const cityNames = zones.split(",").slice(0, 4)
    .map(id => TIMEZONE_DB.find(z => z.id === id.trim())?.city)
    .filter(Boolean)
    .join(" · ");

  const title = t
    ? `Kairos — Meeting time: ${cityNames}`
    : `Kairos — ${cityNames}`;

  const description = t
    ? `Proposed meeting time across ${cityNames} — tap to open in your timezone`
    : `Compare live times across ${cityNames} — find the perfect moment, everywhere`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "Kairos",
      images: [{
        url: ogUrl,
        width: 1200,
        height: 630,
        alt: `Kairos time zones: ${cityNames}`,
      }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
    },
  };
}

export default function Home() {
  return <WorldTimeApp />;
}
