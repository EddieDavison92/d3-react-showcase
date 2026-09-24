"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/", label: "Story", icon: StoryIcon },
  { href: "/explore", label: "Atlas", icon: AtlasIcon },
  { href: "/evidence", label: "Evidence", icon: EvidenceIcon },
  { href: "/about", label: "Methods", icon: MethodsIcon },
]

function useActive() {
  const pathname = usePathname()
  return (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href))
}

export function SiteHeader() {
  const active = useActive()
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line/70 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-4 px-4 sm:px-6 lg:px-10">
          <Link href="/" className="flex items-baseline gap-2 whitespace-nowrap">
            <Mark />
            <span className="display text-[19px] font-normal text-ink">Ten years apart</span>
          </Link>
          <nav className="ml-auto hidden items-center text-sm sm:flex" aria-label="Main">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active(item.href) ? "page" : undefined}
                className={cn(
                  "relative px-3 py-2 transition-colors",
                  active(item.href) ? "text-ink" : "text-ink-3 hover:text-ink"
                )}
              >
                {item.label}
                {active(item.href) ? <span className="absolute inset-x-3 -bottom-[9px] h-[2px] rounded-full bg-ink" /> : null}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <MobileNav />
    </>
  )
}

/** App-style tab bar for phones. */
function MobileNav() {
  const active = useActive()
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line/80 bg-paper/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden"
    >
      <ul className="grid h-16 grid-cols-4">
        {NAV.map(({ href, label, icon: Icon }) => {
          const on = active(href)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 text-[11px] transition-colors",
                  on ? "font-semibold text-ink" : "text-ink-3"
                )}
              >
                <span className={cn("flex h-7 w-12 items-center justify-center rounded-full transition-colors", on && "bg-ink/[0.07]")}>
                  <Icon />
                </span>
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/** Two dots, a gap between them. */
function Mark() {
  return (
    <svg viewBox="0 0 22 10" className="h-2.5 w-[22px] translate-y-[-1px]" aria-hidden>
      <circle cx="4" cy="5" r="4" fill="#b3452c" />
      <circle cx="18" cy="5" r="4" fill="#0b5a4c" />
    </svg>
  )
}

const icon = { width: 20, height: 20, viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, "aria-hidden": true }

function StoryIcon() {
  return (
    <svg {...icon}>
      <path d="M4 4.5h12M4 8.5h12M4 12.5h8" />
      <circle cx="15" cy="14.5" r="1.8" fill="currentColor" stroke="none" />
    </svg>
  )
}

function AtlasIcon() {
  return (
    <svg {...icon}>
      <path d="m10 2.8 6 3.5v7.4l-6 3.5-6-3.5V6.3z" />
      <path d="M10 10v6.9M10 10 4.2 6.5M10 10l5.8-3.5" opacity={0.5} />
    </svg>
  )
}

function EvidenceIcon() {
  return (
    <svg {...icon}>
      <path d="M3.5 16.5h13M3.5 16.5v-13" />
      <circle cx="7" cy="7" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="10" cy="10" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="13.5" cy="12.5" r="1.2" fill="currentColor" stroke="none" />
      <path d="m6 5.5 9 8.5" opacity={0.5} />
    </svg>
  )
}

function MethodsIcon() {
  return (
    <svg {...icon}>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 9v5" />
      <circle cx="10" cy="6.4" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}
