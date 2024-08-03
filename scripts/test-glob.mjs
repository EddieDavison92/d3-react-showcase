// scripts/test-glob.mjs

import fg from 'fast-glob';

async function testPattern() {
  const pattern = 'content/docs/**/*.mdx';
  const files = await fg(pattern);

  console.log('Matched files:', files);
}

testPattern().catch(console.error);
