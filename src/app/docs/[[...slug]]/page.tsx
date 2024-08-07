// src/app/docs/[[...slug]]/page.tsx

import { getDocBySlug, getAllDocs } from '@/lib/docs';
import { serialize } from 'next-mdx-remote/serialize';
import DocContent from '@/components/DocContent';
import { ChevronRightIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import rehypeSlug from 'rehype-slug';
import rehypePrettyCode from 'rehype-pretty-code';
import { Element } from 'hast'; // Import the relevant type from hast

export const metadata = {
  title: 'Documentation',
};

interface PageProps {
  params: { slug?: string[] };
}

export default async function Page({ params }: PageProps) {
  const slug = params.slug?.length ? params.slug.join('/') : 'index';

  // Get current document content
  const { data, content } = getDocBySlug(slug);

  // Serialize the MDX content with the rehype-pretty-code plugin
  const mdxSource = await serialize(content, {
    scope: data,
    mdxOptions: {
      remarkPlugins: [],
      rehypePlugins: [
        [
          rehypePrettyCode,
          {
            theme: 'github-dark-dimmed',
            keepBackground: true,
            grid: true,
            defaultLang: 'sh',
            onVisitLine(node: Element) {
              if (node.children.length === 0) {
                node.children = [{ type: 'text', value: ' ' }];
              }
            },
            onVisitHighlightedLine(node: Element) {
              const className = node.properties.className;
              node.properties.className = Array.isArray(className)
                ? [...className, 'highlighted-line']
                : ['highlighted-line'];
            },
            onVisitLineNumbers(node: Element) {
              const className = node.properties.className;
              node.properties.className = Array.isArray(className)
                ? [...className, 'line-number']
                : ['line-number'];
            },
          },
        ],
        rehypeSlug,
      ],
    },
  });

  // Get all documents for prev/next navigation
  const allDocs = getAllDocs();
  const sortedDocs = allDocs.sort((a, b) => {
    if (a.slug === 'index') return -1;
    if (b.slug === 'index') return 1;
    return a.title.localeCompare(b.title);
  });

  const currentIndex = sortedDocs.findIndex((doc) => doc.slug === slug);
  const prevDoc = currentIndex > 0 ? sortedDocs[currentIndex - 1] : null;
  const nextDoc = currentIndex < sortedDocs.length - 1 ? sortedDocs[currentIndex + 1] : null;

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
            <div className="font-medium text-foreground">{data.title}</div>
          </div>
          <DocContent
            title={data.title}
            description={data.description}
            doc={{ code: mdxSource }}
            prevDoc={prevDoc ? { title: prevDoc.title, slug: prevDoc.slug } : undefined}
            nextDoc={nextDoc ? { title: nextDoc.title, slug: nextDoc.slug } : undefined}
          />
        </div>
      </div>
    </main>
  );
}
