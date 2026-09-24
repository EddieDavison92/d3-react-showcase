import type { Metadata } from "next"
import { Suspense } from "react"
import { ExplorerApp } from "@/components/explorer/ExplorerApp"

export const metadata: Metadata = { title: "Map" }

export default function ExplorePage() {
  return (
    <Suspense>
      <ExplorerApp />
    </Suspense>
  )
}
