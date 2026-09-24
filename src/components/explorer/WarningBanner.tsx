"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { ExplorerWarning } from "@/lib/explorer/types"

export function WarningBanner({ warnings }: { warnings: ExplorerWarning[] }) {
  const always = warnings.filter((warning) => warning.tone === "always")
  const mismatch = warnings.filter((warning) => warning.tone === "mismatch")
  const empty = warnings.filter((warning) => warning.tone === "empty")
  if (!always.length && !mismatch.length && !empty.length) return null

  return (
    <div className="space-y-2">
      {always.map((warning) => (
        <p
          key={warning.id}
          role="note"
          className="text-xs leading-snug text-muted-foreground"
        >
          {warning.body}
        </p>
      ))}
      {mismatch.map((warning) => (
        <Alert
          key={warning.id}
          className="border-amber-200 bg-amber-50 p-3 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-50"
        >
          <AlertTitle className="text-sm leading-snug">{warning.title}</AlertTitle>
          <AlertDescription className="text-sm leading-relaxed">{warning.body}</AlertDescription>
        </Alert>
      ))}
      {empty.map((warning) => (
        <p
          key={warning.id}
          className="rounded-md border bg-muted/40 px-2.5 py-1.5 text-xs leading-relaxed text-muted-foreground"
        >
          {warning.body}
        </p>
      ))}
    </div>
  )
}
