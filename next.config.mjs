// next.config.mjs

import nextMDX from '@next/mdx';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypePrettyCode from 'rehype-pretty-code';


/** @type {import('rehype-pretty-code').Options} */
const options = {
  theme: 'github-dark-default',
  keepBackground: true,
  grid: true,
  defaultLang: 'sh',
  onVisitLine(node) {
    if (node.children.length === 0) {
      node.children = [{ type: 'text', value: ' ' }];
    }
  },
  onVisitHighlightedLine(node) {
    node.properties.className = (node.properties.className || []).concat('highlighted-line');
  },
  onVisitLineNumbers(node) {
    node.properties.className = (node.properties.className || []).concat('line-number');
  },
};

const withMDX = nextMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [
      [rehypePrettyCode, options],
      rehypeSlug,
      rehypeAutolinkHeadings,
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
};

export default withMDX(nextConfig);