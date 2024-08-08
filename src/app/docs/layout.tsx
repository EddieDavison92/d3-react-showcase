// src/app/docs/layout.tsx

import { getDocBySlug } from '@/lib/docs'; // Ensure this function is correct
import { docsConfig } from "@/config/docs";
import { DocsSidebarNav } from "@/components/sidebar-nav";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DocsLayoutProps {
  children: React.ReactNode;
}

export default async function DocsLayout({ children }: DocsLayoutProps) {
  // Fetch the index document title
  const { data: indexData } = getDocBySlug('index'); // Fetch the index document

  return (
    <div className="border-b mx-auto max-w-7xl">
      <div className="container flex items-start gap-6">
        <aside className="hidden mt-14 md:block md:sticky md:top-14 md:w-60 md:shrink-0">
          <ScrollArea className="h-full">
            <DocsSidebarNav config={docsConfig} indexTitle={indexData.title || 'Docs'} />
          </ScrollArea>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
