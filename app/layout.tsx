import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AuthProvider } from "@/hooks/useAuth";
import { BlockedUserGuard } from "@/components/auth/BlockedUserGuard";
import AnalyticsTracker from "@/components/layout/AnalyticsTracker";
import AdSenseScript from "@/components/ads/AdSenseScript";
import { headers } from "next/headers";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Melhora Prudente | Notícias de Presidente Prudente e Região",
    template: "%s | Melhora Prudente"
  },
  description: "O seu portal de notícias local de Presidente Prudente e região do Oeste Paulista. Informação com credibilidade, agilidade e foco regional.",
  keywords: [
    "Presidente Prudente",
    "Prudente",
    "Oeste Paulista",
    "São Paulo",
    "Brasil",
    "Portal de Notícias",
    "Notícias de Presidente Prudente",
    "Informação Local",
    "Esportes",
    "Política",
    "Polícia",
    "Região"
  ],
  metadataBase: new URL("https://melhoraprudente.com.br"),
  alternates: {
    canonical: "/",
    types: {
      'application/rss+xml': 'https://melhoraprudente.com.br/rss.xml',
    }
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  authors: [{ name: "Redação Melhora Prudente", url: "https://melhoraprudente.com.br" }],
  creator: "Melhora Prudente",
  publisher: "Melhora Prudente",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://melhoraprudente.com.br",
    siteName: "Melhora Prudente",
    title: "Melhora Prudente | Notícias de Presidente Prudente e Região",
    description: "O seu portal de notícias local de Presidente Prudente e região do Oeste Paulista. Informação com credibilidade, agilidade e foco regional.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&q=80&w=1200&h=630",
        width: 1200,
        height: 630,
        alt: "Portal Melhora Prudente",
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Melhora Prudente | Notícias de Presidente Prudente e Região",
    description: "O seu portal de notícias local de Presidente Prudente e região do Oeste Paulista.",
    images: ["https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&q=80&w=1200&h=630"]
  }
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const isMidia = headersList.get('x-is-midia') === 'true';

  const schemaOrg = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "NewsMediaOrganization",
        "@id": "https://melhoraprudente.com.br/#organization",
        "name": "Melhora Prudente",
        "url": "https://melhoraprudente.com.br",
        "logo": {
          "@type": "ImageObject",
          "url": "https://melhoraprudente.com.br/logo.jpg",
          "width": 192,
          "height": 192
        },
        "sameAs": [
          "https://www.instagram.com/melhoraprudente",
          "https://www.facebook.com/melhoraprudente"
        ],
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Presidente Prudente",
          "addressRegion": "SP",
          "addressCountry": "BR"
        }
      },
      {
        "@type": "WebSite",
        "@id": "https://melhoraprudente.com.br/#website",
        "url": "https://melhoraprudente.com.br",
        "name": "Melhora Prudente",
        "publisher": {
          "@id": "https://melhoraprudente.com.br/#organization"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://melhoraprudente.com.br/busca?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      }
    ]
  };

  return (
    <html lang="pt-BR" className={isMidia ? "dark" : ""}>
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://picsum.photos" crossOrigin="anonymous" />
        {!isMidia && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
          />
        )}
      </head>
      {isMidia ? (
        <body className={`${inter.className} bg-black text-white antialiased selection:bg-purple-900 selection:text-purple-100 min-h-screen flex flex-col`}>
          <AnalyticsTracker />
          <main className="flex-1 w-full">
            {children}
          </main>
        </body>
      ) : (
        <body className={`${inter.className} text-zinc-900 antialiased selection:bg-red-100 selection:text-red-900`}>
          <AdSenseScript />
          <AnalyticsTracker />
          <AuthProvider>
            <BlockedUserGuard>
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1">
                  {children}
                </main>
                <Footer />
              </div>
            </BlockedUserGuard>
          </AuthProvider>
        </body>
      )}
    </html>
  );
}
