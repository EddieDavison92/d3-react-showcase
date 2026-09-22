"use client"

import { Label } from "@/components/ui/label"
import { familyOf, geoLabel, geosFor, hasAge, sexesFor } from "@/lib/explorer/catalogue"
import { SEX_GAP_LABEL } from "@/lib/explorer/views"
import type { AgeId, AreaRecord, ExplorerState, GeoId, MetricId, SexId } from "@/lib/explorer/types"
import { cn } from "@/lib/utils"

const selectClass =
  "flex min-h-11 w-full rounded-md border border-input bg-background px-3 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"

function Segmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  ariaLabel?: string
}) {
  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "h-9 min-h-9 rounded-md border px-2.5 text-sm sm:h-11 sm:min-h-11 sm:px-3",
            value === option.value
              ? "border-teal-800 bg-teal-800 text-white"
              : "border-input bg-background hover:bg-muted"
          )}
          aria-pressed={value === option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function CompactFilterBar({
  state,
  onChange,
}: {
  state: ExplorerState
  onChange: (patch: Partial<ExplorerState>) => void
}) {
  const sexes = sexesFor(state.metric)
  const showAge = hasAge(state.metric)
  const hideSex = state.view === "sex_gap"
  if (sexes.length === 0 && !showAge && !hideSex) return null

  return (
    <div className="flex max-w-full flex-wrap items-center gap-1.5 overflow-x-clip">
      {sexes.length > 0 && !hideSex ? (
        <Segmented
          ariaLabel="Sex"
          value={state.sex}
          options={sexes.map((sex) => ({ value: sex, label: sex }))}
          onChange={(sex: SexId) => onChange({ sex })}
        />
      ) : hideSex ? (
        <span className="rounded-md border px-2.5 py-1 text-[11px] text-muted-foreground">
          {SEX_GAP_LABEL}
        </span>
      ) : null}
      {showAge ? (
        <Segmented
          ariaLabel="Age"
          value={state.age}
          options={[
            { value: "birth", label: "At birth" },
            { value: "65", label: "At 65" },
          ]}
          onChange={(age: AgeId) => onChange({ age })}
        />
      ) : null}
    </div>
  )
}

export function FilterPanel({
  state,
  areas,
  onChange,
}: {
  state: ExplorerState
  areas: AreaRecord[]
  onChange: (patch: Partial<ExplorerState>) => void
}) {
  const geos = geosFor(state.metric)
  const sexes = sexesFor(state.metric)
  const family = familyOf(state.metric)
  const showAge = hasAge(state.metric)
  const hideSex = state.view === "sex_gap"

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

      {sexes.length > 0 && !hideSex ? (
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Sex
          </Label>
          <Segmented
            ariaLabel="Sex"
            value={state.sex}
            options={sexes.map((sex) => ({ value: sex, label: sex }))}
            onChange={(sex: SexId) => onChange({ sex })}
          />
        </div>
      ) : hideSex ? (
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Sex
          </Label>
          <div className="flex flex-wrap gap-1" aria-label="Sex locked to derived gap">
            {["Male", "Female"].map((label) => (
              <button
                key={label}
                type="button"
                disabled
                className="h-9 min-h-9 rounded-md border border-input px-2.5 text-sm opacity-50 sm:h-11 sm:min-h-11 sm:px-3"
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs leading-snug text-muted-foreground">{SEX_GAP_LABEL}</p>
        </div>
      ) : null}

      {showAge ? (
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Age
          </Label>
          <Segmented
            ariaLabel="Age"
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
            ariaLabel="Avoidable totals"
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

    </div>
  )
}
