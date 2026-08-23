import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import StoreProvider from "@/redux/StoreProvider";
import { AuthInitializer } from "../components/auth/AuthInitializer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Y-Axis Home Loan Management System",
  description: "Customer Application & Workflow Management System",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F8FAFC] text-[#1A2B4C]">
        <StoreProvider>
          <AuthInitializer>{children}</AuthInitializer>
        </StoreProvider>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      </body>
    </html>
  );
}
