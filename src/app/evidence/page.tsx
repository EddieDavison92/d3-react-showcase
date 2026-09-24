import type { Metadata } from "next"
import { Suspense } from "react"
import { EvidenceApp } from "@/components/evidence/EvidenceApp"

export const metadata: Metadata = { title: "Evidence" }

export default function EvidencePage() {
  return (
    <Suspense>
      <EvidenceApp />
    </Suspense>
  )
}
