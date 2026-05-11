import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Capitão Lorí — Duolingo da ANAC para Piloto Privado",
  description:
    "Estude para a prova teórica da ANAC com lições curtas, ofensiva diária, simulado oficial e muita aviação. Voa com a gente.",
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
    title: "Capitão Lorí — Duolingo da ANAC para Piloto Privado",
    description:
      "Lições curtas, ofensiva diária, repetição espaçada e simulado oficial (100q · 3h · 70 % por matéria). Aprovação com hábito.",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Capitão Lorí — Duolingo da ANAC",
    description:
      "5 trilhas oficiais ANAC, 25 lições, 100 questões e simulado ao estilo da banca. Estude 5 min/dia.",
  },
  robots: { index: true, follow: true },
  themeColor: "#0EA5E9",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={nunito.variable}>
      <body className="min-h-screen bg-cloud font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
