"use client"

import Link from "next/link"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ONS_LINKS } from "@/lib/explorer/catalogue"
import { cn } from "@/lib/utils"

export function AboutNumbers({
  triggerClassName,
  triggerVariant = "ghost",
  label,
}: {
  triggerClassName?: string
  triggerVariant?: "ghost" | "outline"
  label?: string
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant={triggerVariant}
          size="sm"
          className={cn("h-9 min-h-9 px-2 sm:h-11 sm:min-h-11 sm:px-3", triggerClassName)}
        >
          {label ?? (
            <>
              <span className="sm:hidden">About</span>
              <span className="hidden sm:inline">About the numbers</span>
            </>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>About the numbers</SheetTitle>
          <SheetDescription>
            Sources, coverage and caveats for this explorer. All statistics are
            reused under the Open Government Licence.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="mt-4 h-[calc(100vh-8rem)] pr-3">
          <div className="space-y-5 text-sm leading-relaxed text-muted-foreground">
            <section className="space-y-2">
              <h3 className="font-medium text-foreground">Period life expectancy</h3>
              <p>
                Figures summarise mortality rates in each three-year window. They
                are not a prediction of how long a baby born then will live. ONS
                did not apply formal significance tests in the 2022–24 local
                bulletin. Isles of Scilly and the City of London are omitted for
                sparse counts.
              </p>
              <p>
                England <strong className="text-foreground">counties (E10)</strong> sit
                in the same workbook “Local Areas” sheet as districts. This
                explorer keeps them as a separate geography so they are never
                co-plotted with lower-tier areas.
              </p>
              <p>
                Equal-area cells — not council outlines.
              </p>
              <p>
                <Link className="underline underline-offset-4" href={ONS_LINKS.leBulletin}>
                  ONS local areas bulletin
                </Link>
                {" · "}
                <Link className="underline underline-offset-4" href={ONS_LINKS.leDataset}>
                  dataset
                </Link>
              </p>
            </section>
            <section className="space-y-2">
              <h3 className="font-medium text-foreground">Healthy life expectancy</h3>
              <p>
                Official statistics in development (APS sample). England local
                grain is <strong className="text-foreground">upper-tier</strong> —
                there are no E07 district figures. Switching from a shire
                district snaps to the containing county or unitary. Birth only in
                this version. Male and female only; no persons total.
              </p>
              <p>
                <Link className="underline underline-offset-4" href={ONS_LINKS.hleBulletin}>
                  HLE bulletin
                </Link>
                {" · "}
                <Link className="underline underline-offset-4" href={ONS_LINKS.hleDataset}>
                  dataset
                </Link>
              </p>
            </section>
            <section className="space-y-2">
              <h3 className="font-medium text-foreground">Avoidable mortality</h3>
              <p>
                ONS Table 4 three-year rolling age-standardised rates for
                England and Wales. Scotland and Northern Ireland are not filled
                in from other publishers. Persons is published here, unlike LE
                and HLE.
              </p>
              <p>
                <Link className="underline underline-offset-4" href={ONS_LINKS.avoidableBulletin}>
                  Avoidable mortality bulletin
                </Link>
              </p>
            </section>
            <section id="about-deprivation" className="space-y-2">
              <h3 className="font-medium text-foreground">Deprivation context</h3>
              <p>
                English IoD 2025 File 10 (lower-tier) is a context strip on the
                life-expectancy map — not a second choropleth. WIMD 2025 is the
                Wales index and is not bundled here; SIMD and NIMDM are not
                interactive. These indices are not comparable across nations and
                are not a cause of life-expectancy differences.
              </p>
              <p>
                <Link className="underline underline-offset-4" href={ONS_LINKS.iod}>
                  IoD 2025
                </Link>
                {" · "}
                <Link className="underline underline-offset-4" href={ONS_LINKS.wimd}>
                  WIMD 2025
                </Link>
              </p>
            </section>
            <section className="space-y-2">
              <h3 className="font-medium text-foreground">Country comparators</h3>
              <p>
                Country and UK rows from the local-areas workbook are for
                comparison with local areas. For official country life
                expectancy use the{" "}
                <Link className="underline underline-offset-4" href={ONS_LINKS.nationalLifeTables}>
                  National life tables
                </Link>
                .
              </p>
            </section>
            <section className="space-y-2">
              <h3 className="font-medium text-foreground">Licence</h3>
              <p>
                Source: Office for National Statistics and Ministry of Housing,
                Communities and Local Government, licensed under the{" "}
                <Link className="underline underline-offset-4" href={ONS_LINKS.ogl}>
                  Open Government Licence v3.0
                </Link>
                . Boundaries: ONS Open Geography (contains OS data © Crown
                copyright and database right).
              </p>
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
