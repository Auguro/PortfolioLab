import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portfolio Lab · B3",
  description: "Comparação entre estratégias de Portfólios no mercado brasileiro",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <script src="https://cdn.jsdelivr.net/pyodide/v0.29.3/full/pyodide.js" async />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}