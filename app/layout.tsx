import type { Metadata } from "next";
import { Space_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Invest Smarter",
  description: "AI-powered insights for smarter investing decisions",
};

import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        "font-mono",
        spaceMono.variable,
        jetbrainsMono.variable
      )}
    >
      <body className="min-h-full flex flex-col font-mono">
        <ThemeProvider
          attribute={["class", "data-theme"]}
          defaultTheme="dark"
          enableSystem={false}
          themes={["light", "dark", "sepia", "nord", "forest", "sunset", "cyberpunk", "royal"]}
        >
          <AuthProvider>
            <QueryProvider>
              <TooltipProvider>{children}</TooltipProvider>
              <Toaster />
            </QueryProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

