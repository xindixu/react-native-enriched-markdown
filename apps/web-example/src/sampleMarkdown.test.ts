import { parseMarkdown } from '../../../src/web/parseMarkdown';
import type { ASTNode } from '../../../src/web/types';
import { sampleMarkdown } from './sampleMarkdown';

function nodesOfType(node: ASTNode, type: ASTNode['type']): ASTNode[] {
  return [
    ...(node.type === type ? [node] : []),
    ...(node.children?.flatMap((child) => nodesOfType(child, type)) ?? []),
  ];
}

describe('LTR example Markdown', () => {
  it('parses spoilers without falling back to raw Markdown', async () => {
    const ast = await parseMarkdown(sampleMarkdown);

    expect(nodesOfType(ast, 'Spoiler')).toHaveLength(5);
  });
});
