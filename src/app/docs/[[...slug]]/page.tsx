import React from "react";
import { notFound } from "next/navigation";
import { docs } from "#site/content";
import { ChevronRightIcon, ExternalLinkIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import "@/styles/mdx.css";
import { cn } from "@/lib/utils";
import DocContent from "@/components/DocContent";

export interface Doc {
  title: string;
  slug: string;
  description?: string;
  links?: {
    doc?: string;
    api?: string;
  };
  code: string;
}

interface DocPageProps {
  params: { slug?: string[] };
}

const DocPage: React.FC<DocPageProps> = ({ params }) => {
  // If params.slug is undefined or empty, serve the index
  const slug = params.slug?.length ? params.slug.join("/") : "docs";

  // Sort documents with "/docs" first, then alphabetically by title
  const sortedDocs = [...docs].sort((a, b) => {
    if (a.slug === "docs") return -1;
    if (b.slug === "docs") return 1;
    return a.title.localeCompare(b.title);
  });

  // Find the document using the existing slug from the sortedDocs
  const doc: Doc | undefined = sortedDocs.find((doc: Doc) => doc.slug === slug);

  if (!doc) {
    console.warn("Document not found for slug:", slug);
    notFound();
    return null;
  }

  const docIndex = sortedDocs.findIndex((d) => d.slug === doc.slug);
  const prevDoc = sortedDocs[docIndex - 1];
  const nextDoc = sortedDocs[docIndex + 1];

  return (
    <main className="container mx-auto">
      <div className="flex flex-col gap-10">
        <div className="flex-1">
          <div className="mt-10 flex items-center space-x-1 text-sm leading-none text-muted-foreground">
            <div className="truncate">
              <a href="/docs" className="hover:underline hover:text-foreground">
                Docs
              </a>
            </div>
            <ChevronRightIcon className="h-3.5 w-3.5" />
            <div className="font-medium text-foreground">{doc.title}</div>
          </div>
          {doc.links && (
            <div className="flex items-center space-x-2">
              {doc.links.doc && (
                <Link
                  href={doc.links.doc}
                  target="_blank"
                  rel="noreferrer"
                  className={cn("badge-secondary gap-1")}
                >
                  Docs
                  <ExternalLinkIcon className="h-3 w-3" />
                </Link>
              )}
              {doc.links.api && (
                <Link
                  href={doc.links.api}
                  target="_blank"
                  rel="noreferrer"
                  className={cn("badge-secondary gap-1")}
                >
                  API Reference
                  <ExternalLinkIcon className="h-3 w-3" />
                </Link>
              )}
            </div>
          )}
          <DocContent
            title={doc.title}
            description={doc.description}
            doc={doc}
            prevDoc={prevDoc}
            nextDoc={nextDoc}
          />
        </div>
      </div>
    </main>
  );
};

export default DocPage;
