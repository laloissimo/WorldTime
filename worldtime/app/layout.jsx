import "./globals.css";

export const metadata = {
  title: "WorldTime — Global Time Zone Planner",
  description: "Compare, convert and coordinate time zones instantly. Free, beautiful, mobile-first.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
