"use client"

import { useEffect, useState } from "react"
import { AreaFinder } from "@/components/explorer/AreaFinder"
import { Segmented, Select } from "@/components/explorer/controls"
import { geoLabel, geosFor, hasAge, MEASURES, sexesFor } from "@/lib/explorer/catalogue"
import type { SearchableArea } from "@/lib/explorer/place-find"
import { VIEW_OPTIONS, viewsFor } from "@/lib/explorer/views"
import type { AgeId, ExplorerState, GeoId, MetricId, SexId, ViewId } from "@/lib/explorer/types"

export function Toolbar({
  state,
  places,
  redirects,
  onChange,
}: {
  state: ExplorerState
  places: SearchableArea[]
  redirects?: Record<string, { code: string; name: string }>
  onChange: (patch: Partial<ExplorerState>) => void
}) {
  const views = viewsFor(state.metric)
  const sexes = sexesFor(state.metric)
  const measure = MEASURES.some((m) => m.id === state.metric) ? state.metric : "le"

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        label="Measure"
        value={measure}
        options={MEASURES.map((m) => ({ value: m.id, label: m.label }))}
        onChange={(metric: MetricId) => onChange({ metric })}
      />
      <Segmented
        label="Sex"
        value={state.sex}
        disabled={state.view === "sex_gap"}
        options={sexes.map((sex) => ({ value: sex, label: sex }))}
        onChange={(sex: SexId) => onChange({ sex })}
      />
      {hasAge(state.metric) ? (
        <Segmented
          label="Age"
          value={state.age}
          options={[
            { value: "birth", label: "At birth" },
            { value: "65", label: "At 65" },
          ]}
          onChange={(age: AgeId) => onChange({ age })}
        />
      ) : null}
      {views.length > 1 ? (
        <Select
          label="Show"
          value={state.view}
          options={VIEW_OPTIONS.filter((v) => views.includes(v.id)).map((v) => ({
            value: v.id,
            label: v.label,
          }))}
          onChange={(view: ViewId) => onChange({ view })}
        />
      ) : null}
      <Select
        label="Geography"
        value={state.geo}
        options={geosFor(state.metric).map((geo) => ({ value: geo, label: geoLabel(geo) }))}
        onChange={(geo: GeoId) => onChange({ geo, area: null })}
      />
      <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
        <div className="min-w-0 flex-1 sm:w-64 sm:flex-none">
          <AreaFinder
            areas={places}
            value={state.area}
            geo={state.geo}
            redirects={redirects}
            onPick={(area) =>
              area ? onChange({ area: area.code, geo: area.geo }) : onChange({ area: null })
            }
          />
        </div>
        <CopyLink />
      </div>
    </div>
  )
}

function CopyLink() {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 1600)
    return () => window.clearTimeout(timer)
  }, [copied])
  return (
    <button
      type="button"
      aria-live="polite"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href)
          setCopied(true)
        } catch {
          window.prompt("Copy this link", window.location.href)
        }
      }}
      className="h-9 shrink-0 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:border-slate-300 hover:text-slate-900"
    >
      {copied ? "Copied" : "Copy link"}
    </button>
  )
}
