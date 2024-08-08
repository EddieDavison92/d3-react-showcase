// src/lib/docs.ts

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const docsDirectory = path.join(process.cwd(), 'content/docs');

// Function to get all published document metadata
export function getAllDocs() {
  return fs.readdirSync(docsDirectory)
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => {
      const slug = file.replace(/\.mdx$/, '');
      const fullPath = path.join(docsDirectory, file);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data } = matter(fileContents);

      return {
        slug,
        href: `/docs/${slug}`, // Ensure href is constructed
        title: data.title || '',
        published: data.published ?? true,
      };
    })
    .filter((doc) => doc.published);
}

// Function to get document data by slug
export function getDocBySlug(slug: string) {
  const fullPath = path.join(docsDirectory, `${slug}.mdx`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  return { data, content };
}
