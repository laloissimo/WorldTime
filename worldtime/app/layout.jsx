import "./globals.css";

export const metadata = {
  title: "Kairos — Time without borders",
  description: "Find the perfect moment, everywhere. Compare and coordinate time zones instantly.",
  metadataBase: new URL("https://kairos-laloicworld.vercel.app"),
  openGraph: {
    title: "Kairos — Time without borders",
    description: "Find the perfect moment, everywhere.",
    siteName: "Kairos",
    images: [{ url: "/api/og", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kairos — Time without borders",
    description: "Find the perfect moment, everywhere.",
    images: ["/api/og"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
