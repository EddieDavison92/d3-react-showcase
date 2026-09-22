import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CATALOGUE } from "@/lib/explorer/catalogue"
import { exploreHref } from "@/lib/explorer/url-state"

export default function CataloguePage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 py-4 sm:space-y-6 sm:py-6">
      <div className="max-w-2xl space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Catalogue</h1>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          Metric families remount Explore with their own geography and coverage.
          Deprivation is a nation-locked strip on the life-expectancy map — not its
          own choropleth, and not a UK league table.
        </p>
      </div>
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        {CATALOGUE.map((card) => (
          <Link key={card.id} href={exploreHref({ metric: card.id })} className="min-h-11">
            <Card className="h-full transition-colors hover:border-teal-700">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg leading-snug sm:text-xl">{card.title}</CardTitle>
                  {card.core ? <Badge className="shrink-0">Core</Badge> : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 p-4 pt-0 sm:p-6 sm:pt-0">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {card.blurb}
                </p>
                <div className="flex flex-wrap gap-1">
                  {card.badges.map((badge) => (
                    <Badge key={badge} variant="outline" className="whitespace-nowrap font-normal">
                      {badge}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
