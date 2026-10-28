import type { MetadataRoute } from "next";
import { SITE_NAME } from "./site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Design DNA Extraction & Transmutation Engine`,
    short_name: SITE_NAME,
    description:
      "Reverse-engineer any live website into a production design system.",
    start_url: "/",
    display: "standalone",
    background_color: "#2261e9",
    theme_color: "#2261e9",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
