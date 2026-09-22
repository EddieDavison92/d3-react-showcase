import Link from "next/link"
import { Button } from "@/components/ui/button"
import { exploreHref } from "@/lib/explorer/url-state"
import { ONS_LINKS } from "@/lib/explorer/catalogue"

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-1 flex-col justify-center gap-8 py-10">
      <div className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-wider text-teal-800">
          Life expectancy explorer
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Local differences in how long people live, shown carefully.
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          Period life expectancy summarises mortality rates in a three-year window.
          It is not a forecast of how long a baby will live, and a place on the map
          is not a verdict on everyone who lives there. This explorer starts from the
          ONS local-areas series for the UK, then offers honest companions — healthy
          life expectancy, avoidable mortality, and nation-specific deprivation
          context — as separate catalogue cards, never one UK mega-map.
        </p>
        <p className="text-base leading-relaxed text-muted-foreground">
          England’s period life expectancy is published for{" "}
          <strong className="text-foreground">districts and unitaries</strong>.
          Healthy life expectancy is published for{" "}
          <strong className="text-foreground">upper-tier</strong> areas. Those
          grains do not match in two-tier shire England. Avoidable mortality here
          is England and Wales only. Deprivation indices are not comparable across
          nations and are not treated as a cause.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href={exploreHref()}>Open Explore</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/catalogue">Browse the catalogue</Link>
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Default cut: period life expectancy, lower-tier UK local areas, 2022–24,
        male, at birth.{" "}
        <Link className="underline underline-offset-4" href={ONS_LINKS.leBulletin}>
          ONS bulletin
        </Link>
        .
      </p>
    </div>
  )
}
