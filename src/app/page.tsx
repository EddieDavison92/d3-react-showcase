import Link from "next/link"
import { AboutNumbers } from "@/components/explorer/AboutNumbers"
import { HeroMap } from "@/components/explorer/HeroMap"
import { Button } from "@/components/ui/button"
import { exploreHref } from "@/lib/explorer/url-state"
import { ONS_LINKS } from "@/lib/explorer/catalogue"

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-8 py-4 lg:flex-row lg:items-center lg:gap-12 lg:py-6">
      <div className="order-2 flex max-w-xl flex-col justify-center gap-5 lg:order-1 lg:w-[42%] lg:shrink-0">
        <p className="text-[11px] font-medium uppercase tracking-widest text-teal-800 sm:text-xs">
          ONS local areas · period life expectancy
        </p>
        <h1 className="text-[2.5rem] font-semibold leading-[1.15] tracking-tight sm:text-5xl">
          How long people live — place by place.
        </h1>
        <p className="max-w-md text-base leading-relaxed text-muted-foreground">
          Period life expectancy for UK local areas. Male at birth is the door in;
          every other cut is one click away.
        </p>
        <div className="space-y-2">
          <Button asChild className="min-h-11 bg-teal-800 px-5 hover:bg-teal-900">
            <Link href={exploreHref()}>Open Explore</Link>
          </Button>
          <p className="text-sm text-teal-800">
            <Link href="/catalogue" className="underline-offset-4 hover:underline">
              Browse catalogue
            </Link>
            {" · "}
            <AboutNumbers
              triggerVariant="ghost"
              label="About the numbers"
              triggerClassName="h-auto min-h-0 px-0 text-sm font-normal text-teal-800 underline-offset-4 hover:underline hover:text-teal-950"
            />
          </p>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Default: 2022–24 · Male · at birth · Absolute. Not a forecast. Hex
          field = equal-area read.{" "}
          <Link className="underline underline-offset-4" href={ONS_LINKS.leBulletin}>
            ONS bulletin
          </Link>
          .
        </p>
      </div>
      <div className="order-1 min-w-0 flex-1 lg:order-2 lg:w-[58%]">
        <HeroMap />
      </div>
    </div>
  )
}
