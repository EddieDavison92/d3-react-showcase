// next.config.mjs

import nextMDX from '@next/mdx';
import rehypeSlug from 'rehype-slug';
import rehypePrettyCode from 'rehype-pretty-code';
// Import the module and destructure to get rehypeOptions
import pkg from './src/utils/rehype-config.js';
const { rehypeOptions } = pkg; // Destructure to get rehypeOptions

const plugins = [];

const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
};

plugins.push(
  nextMDX({
    extension: /\.mdx?$/,
    options: {
      remarkPlugins: [],
      rehypePlugins: [[rehypePrettyCode, rehypeOptions], rehypeSlug],
    },
  })
);

const configuredNextConfig = () => plugins.reduce((config, plugin) => plugin(config), nextConfig);

export default configuredNextConfig;
