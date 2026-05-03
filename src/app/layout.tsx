import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { MainLayout } from "@/components/MainLayout";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Premium Quotation Builder",
  description: "Generate professional quotations with glassmorphism style",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable}`}>
        <AppProvider>
          <MainLayout>
            {children}
          </MainLayout>
        </AppProvider>
      </body>
    </html>
  );
}
