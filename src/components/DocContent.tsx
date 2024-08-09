// src/components/DocContent.tsx

"use client";

import React, { useState, useEffect } from "react";
import { MDXContent } from "@/components/mdx-components";
import { DocsPager } from "@/components/pager";
import { DashboardTableOfContents } from "@/components/toc";
import { MDXRemoteSerializeResult } from "next-mdx-remote";

interface TOCItem {
  title: string;
  url: string;
  items: TOCItem[];
}

interface DocContentProps {
  title: string;
  description?: string;
  doc: {
    code: MDXRemoteSerializeResult;
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
  const [toc, setToc] = useState<{ items: TOCItem[] } | null>(null);
  const [docLoaded, setDocLoaded] = useState(false);

  useEffect(() => {
    if (doc.code) {
      const updateToc = () => {
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
          setToc({ items });
        }
      };

      // Use a timeout to ensure DOM is fully updated before processing TOC
      const timeoutId = setTimeout(() => {
        updateToc();
        setDocLoaded(true);
      }, 50); // A small delay to ensure rendering is complete

      return () => clearTimeout(timeoutId);
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
            <p className="text-base text-muted-foreground mt-2 mb-4">
              {description}
            </p>
          )}
        </div>
        <div className="mdx mt-4">
          <MDXContent code={doc.code} />
        </div>
        {docLoaded && (
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
        )}
      </div>
    </div>
  );
};

function buildTocItems(
  headings: { title: string; url: string; depth: number }[]
): TOCItem[] {
  const tocItems: TOCItem[] = [];
  let lastH2Item: TOCItem | null = null;

  headings.forEach((heading) => {
    const newItem: TOCItem = { title: heading.title, url: heading.url, items: [] };
    if (heading.depth === 2) {
      // If the heading is an H2, it becomes a top-level item
      tocItems.push(newItem);
      lastH2Item = newItem;
    } else if (heading.depth > 2 && lastH2Item) {
      // If the heading is deeper, it becomes a child of the last H2
      let parent = lastH2Item;
      for (let level = 3; level <= heading.depth; level++) {
        if (parent.items.length === 0 || level > heading.depth) {
          parent.items.push(newItem);
          break;
        }
        parent = parent.items[parent.items.length - 1];
      }
    }
  });

  return tocItems;
}

export default DocContent;
