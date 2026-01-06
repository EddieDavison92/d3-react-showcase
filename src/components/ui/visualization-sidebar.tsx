"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface VisualizationSidebarProps {
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
}

const VisualizationSidebarContext = React.createContext<{
  isOpen: boolean
  toggle: () => void
}>({
  isOpen: true,
  toggle: () => {},
})

export function useVisualizationSidebar() {
  return React.useContext(VisualizationSidebarContext)
}

export function VisualizationSidebar({
  children,
  defaultOpen = true,
  className,
}: VisualizationSidebarProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  const toggle = React.useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  return (
    <VisualizationSidebarContext.Provider value={{ isOpen, toggle }}>
      <aside
        className={cn(
          "relative border-l border-border bg-background transition-all duration-300 ease-in-out hidden md:flex flex-col",
          isOpen ? "w-96" : "w-0 overflow-hidden",
          className
        )}
      >
        {/* Collapse/Expand Button - Always visible */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className={cn(
            "absolute top-4 h-8 w-8 rounded-md border border-border bg-background hover:bg-accent z-50",
            isOpen ? "-left-10" : "left-2"
          )}
        >
          {isOpen ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
          <span className="sr-only">{isOpen ? "Collapse" : "Expand"} sidebar</span>
        </Button>

        {/* Sidebar Content */}
        {isOpen && (
          <ScrollArea className="flex-1 p-6">
            {children}
          </ScrollArea>
        )}
      </aside>
    </VisualizationSidebarContext.Provider>
  )
}

export function VisualizationSidebarSection({
  title,
  children,
  className,
}: {
  title?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("space-y-4 mb-6", className)}>
      {title && (
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </h3>
      )}
      <div className="space-y-3">{children}</div>
    </div>
  )
}
