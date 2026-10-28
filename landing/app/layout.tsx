import type { Metadata, Viewport } from "next";
import { Funnel_Display, Instrument_Sans, Instrument_Serif, Space_Mono } from "next/font/google";
import "@fontsource-variable/hubot-sans";
import "./globals.css";
import { AUTHOR_NAME, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "./site";

const funnel = Funnel_Display({
  subsets: ["latin"],
  variable: "--font-funnel",
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Design DNA Extraction & Transmutation Engine`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "reweb",
    "design dna",
    "design token extractor",
    "design system automation",
    "awwwards",
    "computed styles",
    "mcp server",
    "playwright scraping",
    "frontend tooling",
    "miras kustaibek",
  ],
  authors: [{ name: AUTHOR_NAME, url: SITE_URL }],
  creator: AUTHOR_NAME,
  publisher: AUTHOR_NAME,
  category: "developer tools",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Design DNA Extraction & Transmutation Engine`,
    description: SITE_DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Design DNA Extraction & Transmutation Engine`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  // Paste your Google Search Console verification token here if you use the
  // HTML-tag method instead of DNS:
  // verification: { google: "PASTE-TOKEN" },
};

export const viewport: Viewport = {
  themeColor: "#2261e9",
  colorScheme: "dark light",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: "en",
      publisher: { "@id": `${SITE_URL}/#author` },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#app`,
      name: SITE_NAME,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "macOS, Linux, Windows",
      description: SITE_DESCRIPTION,
      license: "https://opensource.org/licenses/MIT",
      author: { "@id": `${SITE_URL}/#author` },
    },
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#author`,
      name: AUTHOR_NAME,
      url: SITE_URL,
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${funnel.variable} ${instrument.variable} ${instrumentSerif.variable} ${spaceMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
