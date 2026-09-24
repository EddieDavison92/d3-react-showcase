"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

/**
 * Sticky stage with captions that scroll past it. The active step is the one
 * crossing the middle of the viewport.
 *
 * Desktop: captions beside the stage. Mobile: the stage fills the screen
 * between the bars; each caption arrives after a screen of chart-only scroll.
 */
export function Scrolly({
  steps,
  stage,
  id,
  side = "left",
}: {
  steps: React.ReactNode[]
  stage: (step: number) => React.ReactNode
  id?: string
  side?: "left" | "right"
}) {
  const [active, setActive] = useState(0)
  const refs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.step))
        }
      },
      { rootMargin: "-48% 0px -48% 0px" }
    )
    for (const el of refs.current) if (el) observer.observe(el)
    return () => observer.disconnect()
  }, [steps.length])

  return (
    <section
      id={id}
      className={cn(
        "relative lg:grid lg:gap-12",
        side === "left" ? "lg:grid-cols-[minmax(0,5fr)_minmax(0,8fr)]" : "lg:grid-cols-[minmax(0,8fr)_minmax(0,5fr)]"
      )}
    >
      <div
        className={cn(
          "sticky top-14 z-0 h-[calc(100dvh-7.5rem)] lg:col-start-2 lg:row-start-1 lg:h-[calc(100dvh-3.5rem)] lg:self-start",
          side === "right" && "lg:col-start-1"
        )}
      >
        {stage(active)}
      </div>
      <div
        className={cn(
          "pointer-events-none relative z-10 -mt-[calc(100dvh-7.5rem)] pb-[30dvh] lg:col-start-1 lg:row-start-1 lg:mt-0 lg:pb-[45dvh]",
          side === "right" && "lg:col-start-2"
        )}
      >
        {steps.map((step, i) => (
          <div
            key={i}
            ref={(el) => {
              refs.current[i] = el
            }}
            data-step={i}
            className={cn(
              "flex items-end lg:items-center lg:pb-0",
              i === 0
                ? "min-h-[calc(100dvh-7.5rem)] pb-3 lg:min-h-[calc(100dvh-3.5rem)]"
                : "min-h-[175dvh] pb-[5dvh] lg:min-h-[78dvh]"
            )}
          >
            <div
              className={cn(
                "pointer-events-auto w-full rounded-2xl border border-line bg-paper/95 p-5 shadow-[0_12px_40px_-24px_rgba(17,19,21,0.35)] backdrop-blur-sm transition-opacity duration-500 sm:p-6",
                "lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none",
                active === i ? "opacity-100" : "lg:opacity-30"
              )}
            >
              {step}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
