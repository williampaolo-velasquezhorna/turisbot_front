import type { Metadata } from "next";
import { geistSans } from "./fonts";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { AuthProvider } from "@/components/providers/AuthProvider";

export const metadata: Metadata = {
  title: "TurisBot - Panel de Administración",
  description:
    "Panel de administración de TurisBot: paquetes turísticos, destinos y tipos de servicio.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>
          <AuthProvider>{children}</AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
