import "./globals.css";
import type { Metadata } from "next";
import SiteControls from "@/components/SiteControls";
import BackgroundVideo from "@/components/BackgroundVideo";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

export const metadata: Metadata = {
  title: "Bhoruka Park Visitor Management",
  description: "Visitor registration and management system",
  applicationName: "Bhoruka Visitor Management",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bhoruka VMS"
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    shortcut: [{ url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <BackgroundVideo />
        {children}
        <SiteControls />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
