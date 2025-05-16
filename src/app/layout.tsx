import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/lib/user-context";
import { RoboAdvisor } from "@/components/robo-advisor";
import { FinancialInsights } from "@/components/financial-insights";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "QuickBank - Your Modern Banking Solution",
  description: "A simple and elegant banking dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 min-h-screen`}>
        <UserProvider>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
          <FinancialInsights />
          <RoboAdvisor />
        </UserProvider>
      </body>
    </html>
  );
}
