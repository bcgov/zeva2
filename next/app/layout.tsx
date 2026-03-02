import { getUserInfo } from "@/auth";
import type { Metadata } from "next";
import "./globals.css";
import { Header } from "./lib/components/Header";
import { NavigationGuardProvider } from "next-navigation-guard";

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
        <body className="antialiased h-screen flex flex-col">
          <NavigationGuardProvider>
            <Header />
            <main className="flex-1 overflow-auto">{children}</main>
          </NavigationGuardProvider>
        </body>
      </html>
    );
  } else {
    // Unauthenticated layout
    return (
      <html lang="en">
        <body className="antialiased h-screen">{children}</body>
      </html>
    );
  }
}
