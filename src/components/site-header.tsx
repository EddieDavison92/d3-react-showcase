"use client"

import * as React from "react"
import { MainNav } from "@/components/main-nav"
import { MobileNav } from "@/components/mobile-nav"
import { ModeToggle} from "@/components/ui/mode-toggle"
import Link from "next/link"
import { siteConfig } from "@/config/site"
import { Button } from "@/components/ui/button"
import { GitHubLogoIcon } from "@radix-ui/react-icons"


// get siteconfig from the config file

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-hidden">
      <div className="container flex h-14 max-w-screen 2xl items-center">
        <MainNav />
        <MobileNav />
        <div className="flex flex-1 items-center justify-end space-x">
          <nav className="flex items-center">
              <Button asChild variant="outline" className="mr-2">
                <a href={siteConfig.links.github} target="_blank" rel="noopener noreferrer">
                <GitHubLogoIcon className="w-4 -mx-1" />
                </a>
              </Button>
            <ModeToggle/>
          </nav>
        </div>
      </div>
    </header>
  )
}