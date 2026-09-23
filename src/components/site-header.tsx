"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { Button } from "@/components/ui/button"
import { AboutNumbers } from "@/components/explorer/AboutNumbers"
import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"

export function SiteHeader() {
  const pathname = usePathname()
  return (
    <header className="sticky top-0 z-50 w-full overflow-x-clip border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[1600px] flex-nowrap items-center gap-1 px-2 sm:gap-3 sm:px-4">
        <Link
          href="/"
          className="flex h-9 min-w-0 shrink-0 items-center gap-2 font-semibold tracking-tight sm:h-11"
        >
          <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm bg-teal-700" />
          <span className="hidden truncate md:inline">{siteConfig.name}</span>
          <span className="md:hidden">LE</span>
        </Link>
        <nav className="flex shrink-0 items-center gap-0.5 text-sm sm:gap-2">
          <Link
            href="/catalogue"
            className={cn(
              "inline-flex h-9 items-center rounded-md px-1.5 text-muted-foreground hover:text-foreground sm:h-11 sm:px-2",
              pathname === "/catalogue" && "font-medium text-foreground"
            )}
          >
            Catalogue
          </Link>
          <Link
            href="/explore"
            className={cn(
              "inline-flex h-9 items-center rounded-md px-1.5 text-muted-foreground hover:text-foreground sm:h-11 sm:px-2",
              pathname === "/explore" && "font-medium text-foreground"
            )}
          >
            Explore
          </Link>
        </nav>
        <div className="ml-auto flex min-w-0 shrink items-center gap-0.5 sm:gap-1">
          <AboutNumbers />
          <ShareButton />
          <div className="hidden sm:block">
            <ModeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}

function ShareButton() {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 1800)
    return () => window.clearTimeout(timer)
  }, [copied])
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-9 min-h-9 min-w-[4.5rem] px-2 sm:h-11 sm:min-h-11 sm:px-3"
      aria-live="polite"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href)
          setCopied(true)
        } catch {
          window.prompt("Copy this link", window.location.href)
        }
      }}
    >
      {copied ? "Link copied" : "Share"}
    </Button>
  )
}
