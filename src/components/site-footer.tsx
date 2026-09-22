import Link from "next/link"
import { ONS_LINKS } from "@/lib/explorer/catalogue"

export function SiteFooter() {
  return (
    <footer className="shrink-0 border-t py-2 sm:py-3">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-1 px-3 text-xs leading-relaxed text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <p>
          Source: ONS,{" "}
          <Link className="underline underline-offset-4" href={ONS_LINKS.ogl}>
            OGL v3.0
          </Link>
          . Boundaries: ONS Open Geography (OS © Crown copyright).
        </p>
        <p>Not official ONS software. Period LE is not a forecast.</p>
      </div>
    </footer>
  )
}
