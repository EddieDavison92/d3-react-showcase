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
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Catalogue
      </p>
      <div className="space-y-1.5">
        {CATALOGUE.map((card) => {
          const active = familyOf(card.id) === family
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelect(card.id)}
              className={cn(
                "flex h-[4.75rem] w-full flex-col justify-center gap-1 rounded-lg border px-2.5 py-2 text-left transition-colors",
                active
                  ? "border-transparent border-l-2 border-l-teal-800 bg-teal-50/50 dark:border-l-teal-400 dark:bg-teal-950/20"
                  : "border-border bg-card hover:bg-muted/60"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold leading-tight">{card.title}</p>
                {card.core ? (
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    Core
                  </Badge>
                ) : null}
              </div>
              <div className="flex min-h-0 flex-wrap gap-1 overflow-hidden">
                {card.badges.slice(0, 2).map((badge) => (
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
