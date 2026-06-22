import type { Metadata } from "next";
import { ThemeToggle } from "@components/theme-toggle";
import { QueryProvider } from "@lib/query-client";
import { ThemeProvider } from "@lib/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeVector Products",
  description: "High-performance product catalog browser",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground">
        <ThemeProvider>
          <QueryProvider>
            <div className="flex min-h-screen flex-col">
              <header className="sticky top-0 z-20 border-b bg-card/80 backdrop-blur-sm">
                <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 sm:px-6">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded border bg-muted text-[10px] font-semibold text-muted-foreground">
                      CV
                    </div>
                    <div className="leading-tight">
                      <p className="text-sm font-medium tracking-tight">CodeVector</p>
                      <p className="text-[11px] text-muted-foreground">Product catalog</p>
                    </div>
                  </div>
                  <ThemeToggle />
                </div>
              </header>
              <main className="flex-1">
                <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6 lg:py-8">
                  {children}
                </div>
              </main>
            </div>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
