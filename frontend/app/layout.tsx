import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Commons Caption Suggestion Tool",
  description: "AI-assisted multilingual caption suggestions for Wikimedia Commons",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
