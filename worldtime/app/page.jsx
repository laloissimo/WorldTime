import WorldTimeApp from "../components/WorldTimeApp";
import { parseShare, shareText, SITE_URL } from "../lib/share";

// Runs on the server for every request, so each share link gets a preview
// (title, description and image) that matches its own zones and time.
export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const share = parseShare(params?.zones, params?.t);
  const { title, description } = shareText(share);
  const hasQuery = Boolean(params?.zones || params?.t);
  const pageUrl = hasQuery ? `${SITE_URL}/?${share.query}` : `${SITE_URL}/`;
  const image = {
    url: `${SITE_URL}/api/og?${share.query}`,
    width: 1200,
    height: 630,
    type: "image/png",
    alt: title,
  };

  return {
    title,
    description,
    // No canonical or og:url on a shared link: Next strips the query from
    // both, which would send crawlers to the bare home page and lose the times.
    ...(hasQuery ? {} : { alternates: { canonical: pageUrl } }),
    openGraph: {
      title,
      description,
      ...(hasQuery ? {} : { url: pageUrl }),
      siteName: "Kairos",
      type: "website",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image.url],
    },
  };
}

export default function Home() {
  return <WorldTimeApp />;
}
