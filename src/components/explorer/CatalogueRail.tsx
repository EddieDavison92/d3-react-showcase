"use client"

import { CATALOGUE, familyOf, metricShort } from "@/lib/explorer/catalogue"
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
      <div className="space-y-1">
        {CATALOGUE.map((card) => {
          const active = familyOf(card.id) === family
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelect(card.id)}
              className={cn(
                "flex min-h-11 w-full flex-col justify-center rounded-md px-2.5 py-1.5 text-left transition-colors",
                active
                  ? "border-l-2 border-l-slate-900 bg-slate-100/70"
                  : "border-l-2 border-l-transparent hover:bg-muted/50"
              )}
            >
              <p className="truncate text-sm font-semibold leading-tight">
                {metricShort(card.id)}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {card.badges[0]}
              </p>
              {active && card.hook ? (
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{card.hook}</p>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
