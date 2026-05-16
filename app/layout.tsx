import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";
import { BiometricGate } from "@/components/auth/BiometricGate";
import { NativeOAuthListener } from "@/components/auth/NativeOAuthListener";

const nunito = Nunito({
  subsets: ["latin"],
  // 500 (medium) added for labels & secondary text where 400 is too thin
  // and 600 too heavy. Matches Apple/SF Pro's hierarchy.
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Capitão Lorí — Estudo para Piloto Privado (PPA)",
  description:
    "Estude para a prova teórica de Piloto Privado com lições curtas, ofensiva diária, simulado no formato da banca e muita aviação. Não filiado à ANAC.",
  applicationName: "Capitão Lorí",
  keywords: [
    "ANAC",
    "piloto privado",
    "PPA",
    "prova teórica",
    "aviação",
    "simulado",
    "regulamentos",
    "meteorologia",
    "navegação aérea",
    "teoria de voo",
  ],
  authors: [{ name: "Capitão Lorí" }],
  openGraph: {
    type: "website",
    siteName: "Capitão Lorí",
    title: "Capitão Lorí — Estudo para Piloto Privado (PPA)",
    description:
      "Lições curtas, ofensiva diária, repetição espaçada e simulado no formato da banca (100q · 3h · 70 % por matéria). Aprovação com hábito.",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Capitão Lorí — Estudo para Piloto Privado",
    description:
      "5 trilhas, 25 lições, 100 questões e simulado no formato da banca. Estude 5 min/dia. Não filiado à ANAC.",
  },
  robots: { index: true, follow: true },
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
    title: "Capitão Lorí",
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={nunito.variable}>
      <body className="min-h-screen bg-cloud font-sans text-ink antialiased">
        <BiometricGate>{children}</BiometricGate>
        <NativeOAuthListener />
        <PwaRegister />
      </body>
    </html>
  );
}
