"use client"

import { Label } from "@/components/ui/label"
import { familyOf, geoLabel, geosFor, hasAge, sexesFor } from "@/lib/explorer/catalogue"
import type { AgeId, AreaRecord, ExplorerState, GeoId, MetricId, SexId, ViewId } from "@/lib/explorer/types"
import { cn } from "@/lib/utils"

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-md border px-2.5 py-1 text-xs",
            value === option.value
              ? "border-teal-800 bg-teal-800 text-white"
              : "border-input bg-background hover:bg-muted"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function FilterPanel({
  state,
  areas,
  periods,
  onChange,
}: {
  state: ExplorerState
  areas: AreaRecord[]
  periods: string[]
  onChange: (patch: Partial<ExplorerState>) => void
}) {
  const geos = geosFor(state.metric)
  const sexes = sexesFor(state.metric)
  const family = familyOf(state.metric)
  const showAge = hasAge(state.metric)
  const showView = family !== "deprivation"

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Geography
        </Label>
        <select
          className={selectClass}
          value={state.geo}
          onChange={(event) => onChange({ geo: event.target.value as GeoId, area: null })}
        >
          {geos.map((geo) => (
            <option key={geo} value={geo}>
              {geoLabel(geo)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Area
        </Label>
        <select
          className={selectClass}
          value={state.area ?? ""}
          onChange={(event) => onChange({ area: event.target.value || null })}
        >
          <option value="">All areas on map</option>
          {areas
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((area) => (
              <option key={area.code} value={area.code}>
                {area.name}
              </option>
            ))}
        </select>
      </div>

      {periods.length > 1 ? (
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Period
          </Label>
          <select
            className={selectClass}
            value={state.year}
            onChange={(event) => onChange({ year: event.target.value })}
          >
            {periods.map((period) => (
              <option key={period} value={period}>
                {period.replace(" to ", "–")}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {sexes.length > 0 ? (
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Sex
          </Label>
          <Segmented
            value={state.sex}
            options={sexes.map((sex) => ({ value: sex, label: sex }))}
            onChange={(sex: SexId) => onChange({ sex })}
          />
        </div>
      ) : null}

      {showAge ? (
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Age
          </Label>
          <Segmented
            value={state.age}
            options={[
              { value: "birth", label: "At birth" },
              { value: "65", label: "At 65" },
            ]}
            onChange={(age: AgeId) => onChange({ age })}
          />
        </div>
      ) : null}

      {family === "avoidable" ? (
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Totals
          </Label>
          <Segmented
            value={state.metric}
            options={[
              { value: "avoidable", label: "Avoidable" },
              { value: "preventable", label: "Preventable" },
              { value: "treatable", label: "Treatable" },
            ]}
            onChange={(metric: MetricId) => onChange({ metric })}
          />
        </div>
      ) : null}

      {showView ? (
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Map scale
          </Label>
          <Segmented
            value={state.view}
            options={[
              { value: "abs", label: "Absolute" },
              { value: "delta", label: "Change vs previous" },
            ]}
            onChange={(view: ViewId) => onChange({ view })}
          />
        </div>
      ) : null}
    </div>
  )
}
