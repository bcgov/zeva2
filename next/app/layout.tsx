import { getUserInfo } from "@/auth";
import type { Metadata } from "next";
import "./globals.css";
import { Header } from "./lib/components/Header";
import { Footer } from "./lib/components/Footer";

export const metadata: Metadata = {
  title: "ZEVA",
  description: "Zero Emission Vehicles Reporting System",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await getUserInfo();
  if (userId !== -1) {
    // Authenticated layout
    return (
      <html lang="en">
        <body className="antialiased min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 overflow-auto p-6">{children}</main>
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
