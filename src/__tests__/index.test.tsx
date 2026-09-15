import { parseMarkdown } from '../web/parseMarkdown';
import type { ASTNode } from '../web/types';

function findTaskListItem(node: ASTNode): ASTNode | undefined {
  if (node.type === 'ListItem' && node.attributes?.isTask === 'true') {
    return node;
  }

  return node.children?.map(findTaskListItem).find(Boolean);
}

function findTaskListItems(node: ASTNode): ASTNode[] {
  return [
    ...(node.type === 'ListItem' && node.attributes?.isTask === 'true'
      ? [node]
      : []),
    ...(node.children?.flatMap(findTaskListItems) ?? []),
  ];
}

function taskListMarkdown(count: number): string {
  return Array.from(
    { length: count },
    (_, index) => `- [${index % 2 === 0 ? ' ' : 'x'}] 😀 task ${index}`
  ).join('\n');
}

async function parseDuration(markdown: string): Promise<number> {
  const start = performance.now();
  await parseMarkdown(markdown);
  return performance.now() - start;
}

async function medianParseDuration(markdown: string): Promise<number> {
  const durations = [];
  for (let i = 0; i < 3; i += 1) {
    durations.push(await parseDuration(markdown));
  }

  return durations.sort((left, right) => left - right)[1]!;
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

  it('serializes source-ordered offsets for nested tasks after an astral emoji', async () => {
    const ast = await parseMarkdown(
      '😀 header\n- [ ] outer\n  - [x] nested\n- [ ] second'
    );

    expect(
      findTaskListItems(ast).map((task) => task.attributes?.taskMarkOffset)
    ).toEqual(['13', '27', '40']);
  });

  it('scales task-mark offset parsing near-linearly', async () => {
    await parseMarkdown('');
    const smallerMarkdown = taskListMarkdown(500);
    const largerMarkdown = taskListMarkdown(3000);
    await parseMarkdown(smallerMarkdown);
    await parseMarkdown(largerMarkdown);

    const smaller = await medianParseDuration(smallerMarkdown);
    const larger = await medianParseDuration(largerMarkdown);

    expect(larger / smaller).toBeLessThan(14);
  });
});
