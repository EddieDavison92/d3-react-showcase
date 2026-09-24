import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/react"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { siteConfig } from "@/config/site"
import { fontDisplay, fontSans } from "@/lib/fonts"
import { cn } from "@/lib/utils"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name}: UK life expectancy by place`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  other: {
    "vercel-toolbar": "disable",
  },
}

export const viewport: Viewport = {
  themeColor: "#f4f4f0",
  viewportFit: "cover",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={cn(fontSans.variable, fontDisplay.variable)}>
      <body className="flex min-h-dvh flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] sm:pb-0">
        <SiteHeader />
        <main className="mx-auto flex w-full min-w-0 max-w-[1440px] flex-1 flex-col px-4 sm:px-6 lg:px-10">
          {children}
        </main>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  )
}
