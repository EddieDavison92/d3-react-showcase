"use client"

import * as React from "react"
import { VisualizationSidebar } from "@/components/ui/visualization-sidebar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Settings2 } from "lucide-react"

interface VisualizationLayoutProps {
  title: string
  description?: string
  children: React.ReactNode
  sidebarContent: React.ReactNode
  sidebarDefaultOpen?: boolean
}

export function VisualizationLayout({
  title,
  description,
  children,
  sidebarContent,
  sidebarDefaultOpen = true,
}: VisualizationLayoutProps) {
  return (
    <div className="flex h-full w-full relative">
      {/* Mobile Controls Button - Fixed Position */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="lg" className="rounded-full h-14 w-14 shadow-lg">
              <Settings2 className="h-6 w-6" />
              <span className="sr-only">Open controls</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-96 overflow-y-auto">
            <div className="mt-6">
              {sidebarContent}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main visualization area */}
      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-8">
          {/* Title and description */}
          {(title || description) && (
            <div className="mb-6">
              {title && <h1 className="text-2xl md:text-4xl font-bold mb-2">{title}</h1>}
              {description && (
                <p className="text-muted-foreground text-sm md:text-base">{description}</p>
              )}
            </div>
          )}

          {/* Visualization content */}
          {children}
        </div>
      </main>

      {/* Desktop Sidebar - Right side, collapsible */}
      <VisualizationSidebar defaultOpen={sidebarDefaultOpen}>
        {sidebarContent}
      </VisualizationSidebar>
    </div>
  )
}
