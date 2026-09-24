import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-1 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:justify-between">
        <p>
          Data: ONS, OHID and MHCLG under the{" "}
          <a
            className="underline underline-offset-2 hover:text-slate-900"
            href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/"
          >
            Open Government Licence v3.0
          </a>
          . Boundaries © Crown copyright.
        </p>
        <p>
          Not an official ONS product.{" "}
          <Link className="underline underline-offset-2 hover:text-slate-900" href="/about">
            Sources and methods
          </Link>
        </p>
      </div>
    </footer>
  )
}
