import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ankuaru - Track and Trade",
  description: "Ankuaru importer portal demo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          crossOrigin=""
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
