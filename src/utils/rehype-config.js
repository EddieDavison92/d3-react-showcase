// rehype-config.js

// Use CommonJS module.exports
module.exports = {
  rehypeOptions: {
    theme: 'github-dark-default',
    grid: true,
    defaultLang: { block: 'sh', inline: 'plaintext' },
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
  },
};
