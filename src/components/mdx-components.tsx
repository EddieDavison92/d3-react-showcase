// src/components/mdx-components.tsx

'use client';

import React, { useState } from 'react';
import Image, { StaticImageData } from 'next/image';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CopyIcon, CheckIcon } from '@radix-ui/react-icons';
import '@/styles/mdx.css';

// Custom CodeBlock component with copy button
const CodeBlock: React.FC<React.HTMLAttributes<HTMLPreElement>> = ({ className, children, ...props }) => {
  const [copied, setCopied] = useState(false);
  const codeRef = React.useRef<HTMLPreElement>(null);

  const handleCopy = () => {
    if (codeRef.current) {
      const code = codeRef.current.innerText;
      navigator.clipboard.writeText(code).then(
        () => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        },
        (err) => {
          console.error('Failed to copy code:', err);
        }
      );
    }
  };

  return (
    <div className="relative" data-rehype-pretty-code-figure>
      <pre ref={codeRef} className={cn('mb-4 mt-6 overflow-x-auto rounded-lg py-4', className)} {...props}>
        {children}
      </pre>
      <Button
        variant="outline"
        size="sm"
        className="absolute top-2 right-2 text-dark-foreground dark:bg-dark-foreground dark:text-dark"
        onClick={handleCopy}
        aria-label="Copy code to clipboard"
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Button>
    </div>
  );
};

// Define components available in MDX content
const components: Record<string, React.ComponentType<any>> = {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertTitle,
  AlertDescription,
  AspectRatio,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Image,
  h1: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className={cn('mt-2 scroll-m-20 text-4xl font-bold', className)} {...props} />
  ),
  h2: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className={cn('mt-12 scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight', className)} {...props} />
  ),
  h3: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className={cn('mt-8 scroll-m-20 text-xl font-semibold tracking-tight', className)} {...props} />
  ),
  h4: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4 className={cn('mt-8 scroll-m-20 text-lg font-semibold tracking-tight', className)} {...props} />
  ),
  h5: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h5 className={cn('mt-8 scroll-m-20 text-lg font-semibold tracking-tight', className)} {...props} />
  ),
  h6: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h6 className={cn('mt-8 scroll-m-20 text-base font-semibold tracking-tight', className)} {...props} />
  ),
  a: ({ className, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a className={cn('font-medium underline underline-offset-4', className)} {...props} />
  ),
  p: ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className={cn('leading-7 [&:not(:first-child)]:mt-6', className)} {...props} />
  ),
  ul: ({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className={cn('my-6 ml-6 list-disc', className)} {...props} />
  ),
  ol: ({ className, ...props }: React.OlHTMLAttributes<HTMLOListElement>) => (
    <ol className={cn('my-6 ml-6 list-decimal', className)} {...props} />
  ),
  li: ({ className, ...props }: React.LiHTMLAttributes<HTMLLIElement>) => (
    <li className={cn('mt-2', className)} {...props} />
  ),
  blockquote: ({ className, ...props }: React.BlockquoteHTMLAttributes<HTMLQuoteElement>) => (
    <blockquote className={cn('mt-6 border-l-2 pl-6 italic', className)} {...props} />
  ),
  img: ({
    src,
    alt = 'Image',
    className,
    width = 500,
    height = 300,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { src: string | StaticImageData }) => (
    <Image
      className={cn('rounded-md border', className)}
      src={src as string | StaticImageData}
      alt={alt}
      width={typeof width === 'string' ? parseInt(width, 10) : width}
      height={typeof height === 'string' ? parseInt(height, 10) : height}
      {...props}
    />
  ),
  hr: (props: React.HTMLAttributes<HTMLHRElement>) => <hr className="my-4 md:my-8" {...props} />,
  table: ({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="my-6 w-full overflow-y-auto">
      <table className={cn('w-full', className)} {...props} />
    </div>
  ),
  tr: ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr className={cn('even:bg-muted m-0 border-t p-0', className)} {...props} />
  ),
  th: ({ className, ...props }: React.ThHTMLAttributes<HTMLTableHeaderCellElement>) => (
    <th className={cn('border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right', className)} {...props} />
  ),
  td: ({ className, ...props }: React.TdHTMLAttributes<HTMLTableDataCellElement>) => (
    <td className={cn('border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right', className)} {...props} />
  ),
  pre: CodeBlock,
  code: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <code className={cn('relative font-mono text-sm', className)} {...props} />
  ),
};

interface MDXContentProps {
  code: MDXRemoteSerializeResult;
}

export function MDXContent({ code }: MDXContentProps) {
  return <MDXRemote {...code} components={components} />;
}