"use client"

import * as React from "react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface MeasureDropdownProps {
  measures: string[]
  onSelect: (measure: string) => void
}

export const MeasureDropdown: React.FC<MeasureDropdownProps> = ({ measures, onSelect }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="default">Select Measure</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Select a measure</DropdownMenuLabel>
        {measures.map((measure) => (
          <DropdownMenuItem key={measure} onSelect={() => onSelect(measure)}>
            {measure}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

