import type { Metadata, Viewport } from "next";
import "./globals.css";
import PWARegister from "@/components/PWARegister";
import MobileNav from "@/components/MobileNav";

export const metadata: Metadata = {
  title: "Smoke Command",
  description: "Restore Medics USA — Field Operations Platform",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Smoke Command",
  },
};

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var t = localStorage.getItem('sc-theme') || 'dark';
            document.documentElement.setAttribute('data-theme', t);
          } catch(e) {}
        ` }} />
      </head>
      <body style={{ margin: 0, minHeight: '100vh', background: '#0f1117', color: '#f4f4f5' }}>
        <PWARegister />
        {children}
        <MobileNav />
      </body>
    </html>
  );
}
