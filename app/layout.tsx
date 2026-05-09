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
