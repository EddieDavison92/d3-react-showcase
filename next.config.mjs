import nextMDX from '@next/mdx';
import rehypeSlug from 'rehype-slug';
import rehypePrettyCode from 'rehype-pretty-code';

/** @type {Array<((config: NextConfig) => NextConfig)>} */
const plugins = [];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
};

/** @type {import('rehype-pretty-code').Options} */
const options = {
  theme: 'github-dark-dimmed',
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

// Add the MDX plugin with rehype options to the plugins array
plugins.push(
  nextMDX({
    extension: /\.mdx?$/,
    options: {
      remarkPlugins: [],
      rehypePlugins: [[rehypePrettyCode, options], rehypeSlug],
    },
  })
);

// Assign the function to a named variable
const configuredNextConfig = () => plugins.reduce((config, plugin) => plugin(config), nextConfig);

// Export the named function
export default configuredNextConfig;
