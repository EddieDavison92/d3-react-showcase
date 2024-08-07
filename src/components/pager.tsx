// src/components/pager.tsx

"use client";

import React from "react";
import { MDXContent } from "@/components/mdx-components"; // Ensure MDXContent is imported correctly
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { MDXRemoteSerializeResult } from 'next-mdx-remote';

interface PagerProps {
  code: MDXRemoteSerializeResult; // MDX content as a serialized result
}

// Assuming DocsPager is meant for navigation between docs, define it here:
interface DocsPagerProps {
  prev?: { title: string; href: string };
  next?: { title: string; href: string };
}

const DocsPager: React.FC<DocsPagerProps> = ({ prev, next }) => (
  <div className="flex justify-between mt-4">
    {prev ? (
      <Link href={prev.href} className={buttonVariants({ variant: "outline" })}>
        &larr; {prev.title}
      </Link>
    ) : <div />} {/* Placeholder for alignment */}
    {next && (
      <Link href={next.href} className={buttonVariants({ variant: "outline" })}>
        {next.title} &rarr;
      </Link>
    )}
  </div>
);

const Pager: React.FC<PagerProps> = ({ code }) => {
  return (
    <div className="max-w-none">
      <MDXContent code={code} />
    </div>
  );
};

export { DocsPager }; // Export DocsPager for use in other components
export default Pager;