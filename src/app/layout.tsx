import type { Metadata } from "next";
import { Anton, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ServiceWorkerRegister } from "@/components/pwa/sw-register";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";
import "./globals.css";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: `${SITE_NAME} | ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: ["mangá online", "ler mangá", "mangás brasileiros", "quadrinhos online", "capítulos de mangá"],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "entretenimento",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: SITE_NAME,
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
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
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  inLanguage: "pt-BR",
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${anton.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <head>
        {/* aplica o tema salvo antes do primeiro paint (evita flash) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("manga-theme");if(t==="light")document.documentElement.setAttribute("data-theme","light");}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c") }}
        />
        {/* ============================================================
          MEU MANGÁ — direction contract (brief-pinned, code-first)

          THESIS: A dark premium manga platform — a clean deep-black
          ground, layered surfaces and a single shonen-yellow accent;
          the browsing experience of a modern manga app, dense and
          fast, built for studio publishing.

          OWN-WORLD: deep-black ground (#0a0a0f); layered neutral
          surfaces with hairline borders; one shonen-yellow accent
          (#f5c518) as the only active voice; Anton display shout for
          titles; JetBrains Mono for numerals and indices.

          STORY: the visitor lands on a featured-work banner, browses
          a wide cover grid, reads inside a near-black reader, and
          comments on chapters as a logged-in user.

          FIRST VIEWPORT: featured banner with the newest work's cover,
          title, synopsis and a reading CTA; the cover grid opening
          below; site nav on top.

          FORM: brief-pinned direction "Plataforma Dark Premium",
          user-selected after the direction roll; build path code-first.

          FINISH: unreviewed and undocumented is unfinished; this build
          ends with the finish review, the verdict, DESIGN.md, and every
          shipping raster carrying its provenance.
        ============================================================ */}
        {children}
        <ServiceWorkerRegister />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
