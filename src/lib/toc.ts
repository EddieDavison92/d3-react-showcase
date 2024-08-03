import { toc } from "mdast-util-toc";
import { remark } from "remark";
import { visit } from "unist-util-visit";
import { Node } from "unist";
import { List, ListItem, Paragraph, Link, Text, Root } from "mdast";

// Define the text types to flatten
const textTypes = ["text", "emphasis", "strong", "inlineCode"];

// Flatten node to extract text content
function flattenNode(node: Node): string {
  const p: string[] = [];
  visit(node, (childNode: Node) => {
    if (textTypes.includes(childNode.type) && (childNode as Text).value) {
      p.push((childNode as Text).value);
    }
  });
  return p.join(``);
}

// TOC item interfaces
export interface Item {
  title: string;
  url: string;
  items?: Item[];
}

interface Items {
  items?: Item[];
}

// Extract TOC items from a node
function getItems(node: Node, current: Item): Item {
  if (!node) {
    return current;
  }

  if (node.type === "paragraph") {
    visit(node, (item: Node) => {
      if (item.type === "link") {
        current.url = (item as Link).url;
        current.title = flattenNode(node);
      }

      if (item.type === "text") {
        current.title = flattenNode(node);
      }
    });

    return current;
  }

  if (node.type === "list") {
    current.items = (node as List).children.map((i: ListItem) =>
      getItems(i, {} as Item)
    );
    return current;
  } else if (node.type === "listItem") {
    const heading = getItems((node as ListItem).children[0], {} as Item);

    if ((node as ListItem).children.length > 1) {
      getItems((node as ListItem).children[1], heading);
    }

    return heading;
  }

  return current;
}

// Remark plugin to generate TOC
const getToc = () => (node: Node, file: any) => {
  const table = toc(node as Root);
  const items = getItems(table.map as Node, {} as Item);

  file.data = items;
};

export type TableOfContents = Items;

// Function to generate the table of contents
export async function getTableOfContents(
  content: string
): Promise<TableOfContents> {
  const result = await remark().use(getToc).process(content);

  return result.data as TableOfContents;
}
