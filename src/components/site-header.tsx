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
      <div className="mx-auto flex h-14 w-full max-w-[1600px] items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-teal-700" />
          <span className="hidden sm:inline">{siteConfig.name}</span>
          <span className="sm:hidden">LE explorer</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link
            href="/catalogue"
            className={cn(
              "text-muted-foreground hover:text-foreground",
              pathname === "/catalogue" && "font-medium text-foreground"
            )}
          >
            Catalogue
          </Link>
          <Link
            href="/explore"
            className={cn(
              "text-muted-foreground hover:text-foreground",
              pathname === "/explore" && "font-medium text-foreground"
            )}
          >
            Explore
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <AboutNumbers />
          <ShareButton />
          <ModeToggle />
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
