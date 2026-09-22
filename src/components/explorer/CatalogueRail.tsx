"use client"

import { Badge } from "@/components/ui/badge"
import { CATALOGUE, familyOf } from "@/lib/explorer/catalogue"
import type { MetricId } from "@/lib/explorer/types"
import { cn } from "@/lib/utils"

export function CatalogueRail({
  metric,
  onSelect,
}: {
  metric: MetricId
  onSelect: (metric: MetricId) => void
}) {
  const family = familyOf(metric)
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Catalogue
      </p>
      <div className="space-y-2">
        {CATALOGUE.map((card) => {
          const active = familyOf(card.id) === family
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelect(card.id)}
              className={cn(
                "min-h-11 w-full rounded-lg border p-2.5 text-left transition-colors sm:p-3",
                active
                  ? "border-teal-700 bg-teal-50 shadow-sm dark:border-teal-400 dark:bg-teal-950/40"
                  : "border-border bg-card hover:bg-muted/60"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold leading-tight">{card.title}</p>
                {card.core ? (
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    Core
                  </Badge>
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {card.badges.map((badge) => (
                  <Badge key={badge} variant="outline" className="text-[10px] font-normal">
                    {badge}
                  </Badge>
                ))}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
