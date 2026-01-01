import type { Metadata } from "next";
import "./globals.css";
import { Fraunces, Quicksand, Caveat } from "next/font/google";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "800"],
});

const sans = Quicksand({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "600", "700"],
});

const script = Caveat({
  subsets: ["latin"],
  variable: "--font-script",
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: "Psi • Maria Laura",
  description: "Cuidado emocional com leveza, ciência e acolhimento.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${display.variable} ${sans.variable} ${script.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
