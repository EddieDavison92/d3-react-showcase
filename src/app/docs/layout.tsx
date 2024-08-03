// src/app/docs/layout.tsx

import { docsConfig } from "@/config/docs";
import { DocsSidebarNav } from "@/components/sidebar-nav";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DocsLayoutProps {
  children: React.ReactNode;
}

export default function DocsLayout({ children }: DocsLayoutProps) {
  return (
    <div className="border-b mx-auto max-w-7xl">
      <div className="container flex items-start gap-6">
        <aside className="hidden md:block md:sticky md:top-14 md:w-60 md:shrink-0">
          <ScrollArea className="h-full">
            <DocsSidebarNav config={docsConfig} />
          </ScrollArea>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
