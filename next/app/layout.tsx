import { getUserInfo } from "@/auth";
import type { Metadata } from "next";
import "./globals.css";
import { Header } from "./lib/components/Header";
import { Footer } from "./lib/components/Footer";
import { LegalDisclaimer } from "./lib/components/LegalDisclaimer";

export const metadata: Metadata = {
  title: "ZEVA",
  description: "Zero Emission Vehicles Reporting System",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId, userIsGov } = await getUserInfo();
  if (userId !== -1) {
    // Authenticated layout
    return (
      <html lang="en">
        <body className="antialiased min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 overflow-auto px-6 pb-6 pt-2">
            {children}
          </main>
          {!userIsGov && <LegalDisclaimer />}
          <Footer />
        </body>
      </html>
    );
  } else {
    // Unauthenticated layout
    return (
      <html lang="en">
        <body className="antialiased min-h-screen flex flex-col">
          <div className="flex-1">{children}</div>
          <Footer />
        </body>
      </html>
    );
  }
}
