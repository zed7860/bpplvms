import "./globals.css";
import type { Metadata } from "next";
import SiteControls from "@/components/SiteControls";

export const metadata: Metadata = {
  title: "Bhoruka Park Visitor Management",
  description: "Visitor registration and management system"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <SiteControls />
      </body>
    </html>
  );
}
