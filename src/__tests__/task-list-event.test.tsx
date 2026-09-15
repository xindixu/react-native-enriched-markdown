import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { normalizeMarkdownStyle } from '../normalizeMarkdownStyle.web';
import { parseMarkdown } from '../web/parseMarkdown';
import { listRenderers } from '../web/renderers/ListRenderers';
import { buildStyles } from '../web/styles';
import type { ASTNode } from '../web/types';
import { indexTaskItems } from '../web/utils';

function taskItems(node: ASTNode): ASTNode[] {
  return [
    ...(node.type === 'ListItem' && node.attributes?.isTask === 'true'
      ? [node]
      : []),
    ...(node.children?.flatMap(taskItems) ?? []),
  ];
}

describe('web task-list press events', () => {
  it.each([
    ['ASCII', '- [ ] plan', 0, 3, true, 'plan'],
    ['astral Unicode', '😀\n- [x] ship', 0, 6, false, 'ship'],
    ['ordered task', '1. [X] ship', 0, 4, false, 'ship'],
    ['blockquote task', '> - [ ] plan', 0, 5, true, 'plan'],
    ['nested task', '- [ ] outer\n  - [x] inner', 1, 17, false, 'inner'],
    [
      'fenced lookalike',
      '```\n- [ ] fake\n```\n- [ ] real',
      0,
      22,
      true,
      'real',
    ],
  ])(
    'emits the source offset and new state for %s',
    async (_name, markdown, taskIndex, offset, checked, text) => {
      const ast = await parseMarkdown(markdown);
      indexTaskItems(ast);
      const node = taskItems(ast)[taskIndex]!;
      const onTaskListItemPress = jest.fn();
      const style = normalizeMarkdownStyle({});
      const ListItem = listRenderers.ListItem!;
      let renderer: ReactTestRenderer;

      await act(async () => {
        renderer = create(
          <ListItem
            node={node}
            style={style}
            styles={buildStyles(style)}
            callbacks={{ onTaskListItemPress }}
            capabilities={{ katex: null }}
            renderChildren={() => text}
          />
        );
      });

      act(() => renderer.root.findByType('input').props.onChange());
      expect(onTaskListItemPress).toHaveBeenLastCalledWith({
        index: taskIndex,
        checked,
        text,
        taskMarkOffset: offset,
      });
      expect(renderer!.root.findByType('input').props.checked).toBe(checked);

      act(() => renderer.root.findByType('input').props.onChange());
      expect(onTaskListItemPress).toHaveBeenLastCalledWith({
        index: taskIndex,
        checked: !checked,
        text,
        taskMarkOffset: offset,
      });
      act(() => renderer.unmount());
    }
  );
});
