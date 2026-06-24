import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smoke Command",
  description: "Every fire is a live lead.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: '100vh', background: '#0f1117', color: '#f4f4f5' }}>
        {children}
      </body>
    </html>
  );
}
