import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Garagem Rocha",
  description: "Gestão de vagas mensalistas",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-paper text-ink font-sans antialiased min-h-screen">{children}</body>
    </html>
  );
}
