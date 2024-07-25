
import type { Metadata } from "next"
import { fontSans } from "@/lib/fonts"
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider"
import { SiteHeader } from "@/components/site-header"
import { siteConfig } from "@/config/site"
import "./globals.css"

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
}

const font = fontSans;

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={cn("min-h-screen antialiased", fontSans.className)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <SiteHeader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}