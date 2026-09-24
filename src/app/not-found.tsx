import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
      <p className="text-sm font-medium text-slate-500">404</p>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Page not found</h1>
      <Link href="/explore" className="text-sm font-medium text-teal-800 hover:underline">
        Open the map →
      </Link>
    </div>
  )
}
