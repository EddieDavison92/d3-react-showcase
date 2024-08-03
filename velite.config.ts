// velite.config.ts

import { defineConfig, defineCollection, s } from 'velite';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypePrettyCode from 'rehype-pretty-code';

const options = {
  defaultLang: "sh",
  theme: "github-dark-default",
};

// Function to clean slugs
const cleanSlug = (slug: string): string => {
  return slug.startsWith('docs/') ? slug.replace('docs/', '') : slug;
};

export default defineConfig({
  collections: {
    docs: defineCollection({
      name: 'Doc',
      pattern: 'docs/**/*.mdx',
      schema: s.object({
        slug: s.path().transform(cleanSlug), // Apply cleanSlug function here
        title: s.string().max(99),
        description: s.string().optional(),
        date: s.date().optional(),
        published: s.boolean().optional(),
        code: s.mdx(),
      }),
    }),
  },
  root: "content",
  output: {
    data: ".velite",
    assets: "public/static",
    base: "/static/",
    name: "[name].[hash6].[ext]",
    clean: true,
  },
  mdx: {
    rehypePlugins: [
      rehypeSlug,
      [rehypePrettyCode, options],
      [
        rehypeAutolinkHeadings,
        {
          behavior: "wrap",
          properties: {
            className: ["subheading-anchor"],
            ariaLabel: "Link to section",
          },
        },
      ],
    ],
    remarkPlugins: [],
  },
});
