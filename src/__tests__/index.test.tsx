import { parseMarkdown } from '../web/parseMarkdown';
import type { ASTNode } from '../web/types';

function findTaskListItem(node: ASTNode): ASTNode | undefined {
  if (node.type === 'ListItem' && node.attributes?.isTask === 'true') {
    return node;
  }

  return node.children?.map(findTaskListItem).find(Boolean);
}

describe('WASM task-list parsing', () => {
  it.each([
    ['an ASCII task marker', '- [ ] plan', '3'],
    ['a task marker after an astral emoji', '😀\n- [x] ship', '6'],
  ])(
    'serializes the UTF-16 offset for %s',
    async (_name, markdown, expectedOffset) => {
      const ast = await parseMarkdown(markdown);
      const task = findTaskListItem(ast);

      expect(task).toMatchObject({
        type: 'ListItem',
        attributes: {
          isTask: 'true',
          taskMarkOffset: expectedOffset,
        },
      });
    }
  );
});
