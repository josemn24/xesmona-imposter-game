import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Juego del Impostor",
  description: "App web local para jugar al impostor de palabras.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
