import "./globals.css";
import { SITE_URL } from "../lib/share";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Kairos — Time without borders",
  description: "Find the perfect moment, everywhere. Compare and coordinate time zones instantly.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
