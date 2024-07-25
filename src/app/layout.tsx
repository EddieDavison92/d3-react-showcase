import type { Metadata } from "next"
import { fontSans } from "@/lib/fonts"
import { cn } from "@/lib/utils"
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

const noFlashScript = `
  (function() {
    try {
      var theme = localStorage.getItem('theme');
      if (theme) {
        document.documentElement.className = theme;
      } else {
        var systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        theme = systemPrefersDark ? 'dark' : 'light';
        document.documentElement.className = theme;
      }
    } catch (e) {}
  })();
`;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body className={cn("min-h-screen antialiased", fontSans.className)}>
          <SiteHeader />
          {children}
      </body>
    </html>
  )
}