import Link from "next/link"
import { AboutNumbers } from "@/components/explorer/AboutNumbers"
import { HeroMap } from "@/components/explorer/HeroMap"
import { Button } from "@/components/ui/button"
import { exploreHref } from "@/lib/explorer/url-state"
import { ONS_LINKS } from "@/lib/explorer/catalogue"

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-[1360px] flex-1 flex-col gap-10 px-1 py-4 sm:px-4 lg:flex-row lg:items-center lg:gap-16 lg:py-10">
      <div className="order-2 flex max-w-xl flex-col justify-center lg:order-1 lg:w-[40%] lg:shrink-0">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
          ONS local areas · period life expectancy
        </p>
        <h1 className="mt-4 text-balance text-[2.5rem] font-semibold leading-[1.1] tracking-tight sm:text-[3.25rem]">
          Period life expectancy for UK local areas
        </h1>
        <p className="mt-5 max-w-md text-pretty text-base leading-relaxed text-slate-600 sm:text-[17px]">
          A summary of death rates in 2022–24 — not a forecast of how long anyone
          will live. Showing males at birth; females and change are in Explore.
        </p>
        <div className="mt-8">
          <Button asChild className="min-h-11 bg-teal-800 px-6 hover:bg-teal-900">
            <Link href={exploreHref()}>Open Explore</Link>
          </Button>
        </div>
        <p className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
          <Link href="/catalogue" className="underline-offset-4 hover:text-foreground hover:underline">
            Browse catalogue
          </Link>
          <span aria-hidden className="text-slate-300">
            ·
          </span>
          <AboutNumbers
            triggerVariant="ghost"
            label="About the numbers"
            triggerClassName="h-auto min-h-0 px-0 sm:h-auto sm:min-h-0 sm:px-0 text-sm font-normal text-slate-600 underline-offset-4 hover:bg-transparent hover:underline hover:text-foreground"
          />
          <span aria-hidden className="text-slate-300">
            ·
          </span>
          <Link
            className="underline-offset-4 hover:text-foreground hover:underline"
            href={ONS_LINKS.leBulletin}
          >
            ONS bulletin
          </Link>
        </p>
      </div>
      <div className="order-1 min-w-0 flex-1 lg:order-2 lg:w-[60%]">
        <HeroMap />
      </div>
    </div>
  )
}
