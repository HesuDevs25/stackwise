"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/sidebar";
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/auth';

  return (
    <html lang="en">
      <body className={inter.className}>
        {isAuthPage ? (
          // For auth page, just render the children without the sidebar
          <main>{children}</main>
        ) : (
          // For all other pages, include the sidebar
          <div className="flex h-screen">
            <Sidebar />
            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </div>
        )}
      </body>
    </html>
  );
}
