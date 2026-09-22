import { Suspense } from "react"
import { ExplorerApp } from "@/components/explorer/ExplorerApp"

export default function ExplorePage() {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:min-h-[calc(100dvh-8rem)]">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading explorer…</p>}>
        <ExplorerApp />
      </Suspense>
    </div>
  )
}
