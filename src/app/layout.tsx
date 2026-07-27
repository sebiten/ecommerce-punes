import type { Metadata, Viewport } from "next";
import { Archivo_Black, Manrope } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";
import { ThemeProvider } from "@/components/theme-provider";
import {
  SITE_DESCRIPTION,
  SITE_DEPARTMENT,
  SITE_NAME,
  SITE_REGION,
  SITE_REGION_CODE,
} from "@/lib/site";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-gloria-body",
  subsets: ["latin"],
});

const archivoBlack = Archivo_Black({
  variable: "--font-gloria-display",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  title: {
    default: `${SITE_NAME} | Ropa y uniformes escolares en Ledesma`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  category: "shopping",
  creator: SITE_NAME,
  publisher: SITE_NAME,
  keywords: [
    "tienda de ropa en Ledesma",
    "ropa en Libertador General San Martín",
    "uniformes escolares en Ledesma",
    "uniformes escolares en Jujuy",
    "uniformes para primaria",
    "uniformes para secundaria",
    "remeras escolares",
    "camisas escolares",
    "pantalones escolares",
    "medias escolares",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: SITE_NAME,
    title: `${SITE_NAME} | Ropa y uniformes escolares en ${SITE_DEPARTMENT}`,
    description: SITE_DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Ropa y uniformes escolares`,
    description: SITE_DESCRIPTION,
  },
  other: {
    "geo.region": SITE_REGION_CODE,
    "geo.placename": `${SITE_DEPARTMENT}, ${SITE_REGION}`,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#a8d829",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-AR"
      data-scroll-behavior="smooth"
      className={`${manrope.variable} ${archivoBlack.variable}`}
    >
      <body className="flex min-h-full flex-col antialiased">
        <ClerkProvider
          localization={esES as any}
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
        >
          <ThemeProvider>{children}</ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
