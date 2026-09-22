import Link from "next/link"
import { ONS_LINKS } from "@/lib/explorer/catalogue"

export function SiteFooter() {
  return (
    <footer className="border-t py-3">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-1 px-4 text-xs leading-relaxed text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          Source: Office for National Statistics, licensed under the{" "}
          <Link className="underline underline-offset-4" href={ONS_LINKS.ogl}>
            Open Government Licence v3.0
          </Link>
          . Boundaries: ONS Open Geography (contains OS data © Crown copyright
          and database right).
        </p>
        <p>Not official ONS software. Period LE is not a forecast.</p>
      </div>
    </footer>
  )
}
