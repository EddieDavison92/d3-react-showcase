import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/react"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { siteConfig } from "@/config/site"
import { fontSans } from "@/lib/fonts"
import { cn } from "@/lib/utils"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  other: {
    "vercel-toolbar": "disable",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body className={cn("flex min-h-dvh flex-col bg-white text-slate-900 antialiased", fontSans.className)}>
        <SiteHeader />
        <main className="mx-auto flex w-full min-w-0 max-w-[1600px] flex-1 flex-col px-3 py-4 sm:px-4">
          {children}
        </main>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  )
}
