import "./globals.css";

import { AuthProvider } from "@/contexts/AuthContext";
import type { Metadata } from "next";
import { QueryProvider } from "@/providers/QueryProvider";

export const metadata: Metadata = {
  title: "Wikimedia Commons Caption Translation Tool",
  description: "AI-assisted multilingual caption translation for Wikimedia Commons",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased" suppressHydrationWarning>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
