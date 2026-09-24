"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/explore", label: "Map" },
  { href: "/evidence", label: "Evidence" },
  { href: "/about", label: "About" },
]

export function SiteHeader() {
  const pathname = usePathname()
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-3 sm:gap-6 sm:px-4">
        <Link href="/" className="flex items-center gap-2 whitespace-nowrap font-semibold tracking-tight text-slate-900">
          <span className="h-2.5 w-2.5 rounded-sm bg-teal-700" aria-hidden />
          {siteConfig.name}
        </Link>
        <nav className="flex items-center gap-0.5 text-sm sm:gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-2 py-1.5 text-slate-600 hover:text-slate-900 sm:px-2.5",
                pathname === item.href && "bg-slate-100 font-medium text-slate-900"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <a
          href={siteConfig.github}
          className="ml-auto hidden text-sm text-slate-500 hover:text-slate-900 sm:block"
        >
          GitHub
        </a>
      </div>
    </header>
  )
}
