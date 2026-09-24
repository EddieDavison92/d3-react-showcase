import { Fraunces, Instrument_Sans } from "next/font/google"

/** Text and interface. */
export const fontSans = Instrument_Sans({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-sans",
  display: "swap",
})

/** Headlines and figures: light, soft serif. */
export const fontDisplay = Fraunces({
  subsets: ["latin"],
  axes: ["SOFT", "opsz"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
})
