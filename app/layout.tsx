import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";
import { BiometricGate } from "@/components/auth/BiometricGate";
import { NativeOAuthListener } from "@/components/auth/NativeOAuthListener";
import { NativeSessionPersistence } from "@/components/auth/NativeSessionPersistence";
import { ThemeProvider, NO_FLASH_SCRIPT } from "@/components/theme/ThemeProvider";
import { A11yProvider, A11Y_NO_FLASH_SCRIPT } from "@/components/a11y/A11yProvider";

const nunito = Nunito({
  subsets: ["latin"],
  // 500 (medium) added for labels & secondary text where 400 is too thin
  // and 600 too heavy. Matches Apple/SF Pro's hierarchy.
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-nunito",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://capitaolori.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Comandante Lorí — Estudo para Piloto Privado (PPA)",
    template: "%s · Comandante Lorí",
  },
  description:
    "Estude para a prova teórica de Piloto Privado com lições curtas, ofensiva diária, simulado no formato da banca e muita aviação. Não filiado à ANAC.",
  applicationName: "Comandante Lorí",
  keywords: [
    "ANAC",
    "piloto privado",
    "PPA",
    "prova teórica ANAC",
    "simulado ANAC PP",
    "aviação",
    "aprender a voar",
    "escola de aviação",
    "regulamentos de tráfego aéreo",
    "meteorologia aeronáutica",
    "navegação aérea",
    "teoria de voo",
    "ICAO alfabeto fonético",
    "comunicações aeronáuticas",
  ],
  authors: [{ name: "Comandante Lorí" }],
  category: "education",
  alternates: {
    canonical: SITE_URL,
    languages: {
      "pt-BR": SITE_URL,
      en: SITE_URL,
      es: SITE_URL,
    },
  },
  openGraph: {
    type: "website",
    siteName: "Comandante Lorí",
    url: SITE_URL,
    title: "Comandante Lorí — Estudo para Piloto Privado (PPA)",
    description:
      "Lições curtas, ofensiva diária, repetição espaçada e simulado no formato da banca (100q · 3h · 70 % por matéria). Aprovação com hábito.",
    locale: "pt_BR",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Comandante Lorí — app de estudo para Piloto Privado",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Comandante Lorí — Estudo para Piloto Privado",
    description:
      "5 trilhas, 25 lições, 100 questões e simulado no formato da banca. Estude 5 min/dia. Não filiado à ANAC.",
    images: ["/og.png"],
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
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Comandante Lorí",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#0EA5E9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={nunito.variable} suppressHydrationWarning>
      <head>
        {/* Inline script runs before React hydrates and applies the
            user's stored theme so the page never flashes white when
            opening in dark mode. */}
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: A11Y_NO_FLASH_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-cloud font-sans text-ink antialiased dark:bg-ink-deep dark:text-cloud">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            <A11yProvider>
              <NativeSessionPersistence />
              <BiometricGate>{children}</BiometricGate>
              <NativeOAuthListener />
              <PwaRegister />
            </A11yProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
