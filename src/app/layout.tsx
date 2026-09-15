import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
});

export const metadata: Metadata = {
  title: "Img to PDF converter.",
  description: "Fast, offline, and secure Image to PDF converter.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${ibmPlexMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-mono selection:bg-[#FF1F87]/20">
        {children}
      </body>
    </html>
  );
}
