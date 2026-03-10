import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Paridade de Risco · B3",
  description: "Comparação entre Paridade de Risco e Portfólio Eficiente no mercado brasileiro",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  );
}