import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { LangProvider } from "@/lib/i18n";
import { FavoritesProvider } from "@/components/FavoritesProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/* ---------- SEO: Metadata كاملة ---------- */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "xox | عقارك اللي بتحلم بيه موجود هنا — عقارات مصر",
    template: "%s | xox",
  },
  description:
    "xox — موقع التسويق العقاري الأول في مصر. شقق وفلات ومحلات تجارية للبيع والإيجار في كل المحافظات. فلترة سهلة بالمحافظة والمدينة والمساحة وعدد الغرف والسعر.",
  keywords: [
    "عقارات مصر",
    "شقق للبيع",
    "شقق للإيجار",
    "فيلات",
    "شاليهات",
    "محلات تجارية",
    "عقارات القاهرة",
    "عقارات الجيزة",
    "عقارات الإسكندرية",
    "xox عقارات",
    "real estate egypt",
    "apartments for sale",
  ],
  authors: [{ name: "xox" }],
  creator: "xox",
  applicationName: "xox",
  alternates: {
    canonical: "/",
    languages: { "ar-EG": "/", "en": "/" },
  },
  openGraph: {
    type: "website",
    locale: "ar_EG",
    alternateLocale: "en_US",
    url: siteUrl,
    siteName: "xox",
    title: "xox | عقارك اللي بتحلم بيه موجود هنا",
    description:
      "شقق وفلات ومحلات للبيع والإيجار في كل محافظات مصر — فلترة ذكية وسهلة.",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "xox — موقع التسويق العقاري",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "xox | عقارك اللي بتحلم بيه موجود هنا",
    description: "شقق وفلات ومحلات للبيع والإيجار في كل محافظات مصر.",
    images: ["/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "real estate",
};

export const viewport: Viewport = {
  themeColor: "#1e3a8a",
  width: "device-width",
  initialScale: 1,
};

/* ---------- SEO: بيانات منظمة JSON-LD ---------- */
function SiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "RealEstateAgent",
        "@id": `${siteUrl}/#organization`,
        name: "xox",
        url: siteUrl,
        description: "موقع التسويق العقاري — شقق وفلات ومحلات للبيع والإيجار في مصر",
        areaServed: { "@type": "Country", name: "Egypt" },
        telephone: "+201556956343",
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "xox",
        inLanguage: "ar-EG",
        publisher: { "@id": `${siteUrl}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}/properties?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="min-h-screen flex flex-col antialiased">
        <LangProvider>
          <FavoritesProvider>
            <SiteJsonLd />
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </FavoritesProvider>
        </LangProvider>
      </body>
    </html>
  );
}
