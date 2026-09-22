"use client"

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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex min-h-14 w-full max-w-[1600px] items-center gap-2 px-3 py-1.5 sm:gap-3 sm:px-4">
        <Link
          href="/"
          className="flex min-h-11 min-w-0 shrink items-center gap-2 font-semibold tracking-tight"
        >
          <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm bg-teal-700" />
          <span className="hidden truncate md:inline">{siteConfig.name}</span>
          <span className="md:hidden">LE</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm sm:gap-2">
          <Link
            href="/catalogue"
            className={cn(
              "inline-flex min-h-11 items-center rounded-md px-2 text-muted-foreground hover:text-foreground",
              pathname === "/catalogue" && "font-medium text-foreground"
            )}
          >
            Catalogue
          </Link>
          <Link
            href="/explore"
            className={cn(
              "inline-flex min-h-11 items-center rounded-md px-2 text-muted-foreground hover:text-foreground",
              pathname === "/explore" && "font-medium text-foreground"
            )}
          >
            Explore
          </Link>
        </nav>
        <div className="ml-auto flex min-w-0 items-center gap-0.5 sm:gap-1">
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
  return (
    <Button
      variant="ghost"
      size="sm"
      className="min-h-11 px-2 sm:px-3"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href)
        } catch {
          window.prompt("Copy this link", window.location.href)
        }
      }}
    >
      Share
    </Button>
  )
}
