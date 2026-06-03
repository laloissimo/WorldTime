import "./globals.css";

export const metadata = {
  title: "Kairos — Time without borders",
  description: "Find the perfect moment, everywhere. Compare and coordinate time zones instantly. Free, beautiful, mobile-first.",
  openGraph: {
    title: "Kairos — Time without borders",
    description: "Find the perfect moment, everywhere.",
    siteName: "Kairos",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
