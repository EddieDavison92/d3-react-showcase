// src/components/DocContent.tsx

"use client";

import React, { useState, useEffect } from "react";
import { Mdx } from "@/components/mdx-components";
import { DocsPager } from "@/components/pager";
import { DashboardTableOfContents } from "@/components/toc";
import { TableOfContents, Item } from "@/lib/toc";
import Balancer from "react-wrap-balancer";

interface DocContentProps {
  title: string;
  description?: string;
  doc: {
    code: string;
  };
  prevDoc?: {
    title: string;
    slug: string;
  };
  nextDoc?: {
    title: string;
    slug: string;
  };
}

const DocContent: React.FC<DocContentProps> = ({
  title,
  description,
  doc,
  prevDoc,
  nextDoc,
}) => {
  const [toc, setToc] = useState<TableOfContents | null>(null);

  useEffect(() => {
    const container = document.querySelector(".mdx") as HTMLElement;
    if (container) {
      const headings = Array.from(
        container.querySelectorAll("h1, h2, h3, h4, h5, h6")
      ).map((heading) => ({
        title: heading.textContent || "",
        url: `#${heading.id}`,
        depth: Number(heading.tagName[1]),
      }));
      const items = buildTocItems(headings);
      setToc({ items }); // Always set to an object, even if empty
    }
  }, [doc.code]);

  return (
    <div className="flex flex-col xl:flex-row-reverse gap-6">
      <aside className="hidden xl:block xl:w-60">
        <div className="fixed overflow-y-auto mt-6 text-sm">
          {toc && toc.items && toc.items.length > 0 && (
            <DashboardTableOfContents toc={toc} />
          )}
        </div>
      </aside>
      <div className="flex-1 xl:w-[624px] sm:w-[500px] w-[320px] pt-6 mb-8">
        <div className="space-y-2">
          <h1 className="scroll-m-20 text-3xl mb-2 font-bold tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-base text-muted-foreground">
              <Balancer className="mt-2 mb-4">{description}</Balancer>
            </p>
          )}
        </div>
        <Mdx code={doc.code} />
        <DocsPager
          prev={
            prevDoc
              ? { title: prevDoc.title, href: `/docs/${prevDoc.slug}` }
              : undefined
          }
          next={
            nextDoc
              ? { title: nextDoc.title, href: `/docs/${nextDoc.slug}` }
              : undefined
          }
        />
      </div>
    </div>
  );
};

function buildTocItems(
  headings: { title: string; url: string; depth: number }[]
): Item[] {
  const tocItems: Item[] = [];
  headings.forEach((heading) => {
    const newItem: Item = { title: heading.title, url: heading.url, items: [] };
    let level = heading.depth;
    let lastItem = tocItems;
    while (--level > 0) {
      lastItem = lastItem[lastItem.length - 1]?.items || lastItem;
    }
    lastItem.push(newItem);
  });
  return tocItems;
}

export default DocContent;
