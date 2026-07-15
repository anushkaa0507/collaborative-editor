import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/auth-context";
import { Sidebar } from "@/components/ui/sidebar";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Collaborative Editor",
  description: "Local-first collaborative document editor",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={montserrat.className}>
        <AuthProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 min-w-0">{children}</div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}