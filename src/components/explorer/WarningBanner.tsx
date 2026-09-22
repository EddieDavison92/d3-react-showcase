"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { ExplorerWarning } from "@/lib/explorer/types"
import { cn } from "@/lib/utils"

export function WarningBanner({ warnings }: { warnings: ExplorerWarning[] }) {
  const mismatch = warnings.filter((w) => w.tone !== "always")
  const always = warnings.filter((w) => w.tone === "always")
  const shown = mismatch.length ? mismatch : always.slice(0, 1)
  if (!shown.length) return null

  return (
    <div className="space-y-2">
      {shown.map((warning) => (
        <Alert
          key={warning.id}
          className={cn(
            "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-50",
            warning.tone === "always" &&
              "border-teal-200 bg-teal-50 text-teal-950 dark:border-teal-900/60 dark:bg-teal-950/40 dark:text-teal-50"
          )}
        >
          <AlertTitle className="text-sm">{warning.title}</AlertTitle>
          <AlertDescription className="text-sm leading-relaxed">
            {warning.body}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  )
}
