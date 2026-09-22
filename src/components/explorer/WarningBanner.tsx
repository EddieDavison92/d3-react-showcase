"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { ExplorerWarning } from "@/lib/explorer/types"

export function WarningBanner({ warnings }: { warnings: ExplorerWarning[] }) {
  const mismatch = warnings.filter((w) => w.tone !== "always")
  const always = warnings.filter((w) => w.tone === "always")
  if (!mismatch.length && !always.length) return null

  return (
    <div className="space-y-2">
      {mismatch.map((warning) => (
        <Alert
          key={warning.id}
          className="border-amber-200 bg-amber-50 p-3 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-50"
        >
          <AlertTitle className="text-sm leading-snug">{warning.title}</AlertTitle>
          <AlertDescription className="text-sm leading-relaxed">{warning.body}</AlertDescription>
        </Alert>
      ))}
      {!mismatch.length && always[0] ? (
        <p className="text-xs leading-relaxed text-muted-foreground">{always[0].body}</p>
      ) : null}
    </div>
  )
}
