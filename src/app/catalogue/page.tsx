import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CATALOGUE } from "@/lib/explorer/catalogue"
import { exploreHref } from "@/lib/explorer/url-state"

export default function CataloguePage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 py-6">
      <div className="max-w-2xl space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Catalogue</h1>
        <p className="text-muted-foreground">
          Each card remounts Explore with its own geography, periods and coverage
          badges. Companions are not layers on the life-expectancy map.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {CATALOGUE.map((card) => (
          <Link key={card.id} href={exploreHref({ metric: card.id })}>
            <Card className="h-full transition-colors hover:border-teal-700">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-xl">{card.title}</CardTitle>
                  {card.core ? <Badge>Core</Badge> : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {card.blurb}
                </p>
                <div className="flex flex-wrap gap-1">
                  {card.badges.map((badge) => (
                    <Badge key={badge} variant="outline" className="font-normal">
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
