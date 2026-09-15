import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import type { ASTNode } from '../web/types';

const mockParseMarkdown = jest.fn();

jest.mock('../web/parseMarkdown', () => ({
  parseMarkdown: (...args: unknown[]) => mockParseMarkdown(...args),
}));

import { EnrichedMarkdownText } from '../web/EnrichedMarkdownText';

const taskDocument = (text: string, taskMarkOffset: number): ASTNode => ({
  type: 'Document',
  children: [
    {
      type: 'UnorderedList',
      children: [
        {
          type: 'ListItem',
          attributes: {
            isTask: 'true',
            taskChecked: 'false',
            taskMarkOffset: String(taskMarkOffset),
          },
          children: [{ type: 'Text', content: text }],
        },
      ],
    },
  ],
});

describe('web task-list render versions', () => {
  beforeEach(() => {
    mockParseMarkdown.mockReset();
  });

  it('suppresses task events while a replacement document is parsing', async () => {
    const firstDocument = taskDocument('first', 3);
    const secondDocument = taskDocument('second', 8);
    let resolveSecondParse: ((ast: ASTNode) => void) | undefined;
    mockParseMarkdown
      .mockResolvedValueOnce(firstDocument)
      .mockImplementationOnce(
        () =>
          new Promise<ASTNode>((resolve) => {
            resolveSecondParse = resolve;
          })
      );
    const firstPress = jest.fn();
    const secondPress = jest.fn();
    let renderer: ReactTestRenderer;

    await act(async () => {
      renderer = create(
        <EnrichedMarkdownText
          markdown="- [ ] first"
          md4cFlags={{ latexMath: false }}
          onTaskListItemPress={firstPress}
        />
      );
    });

    await act(async () => {
      renderer.update(
        <EnrichedMarkdownText
          markdown="intro\n- [ ] second"
          md4cFlags={{ latexMath: false }}
          onTaskListItemPress={secondPress}
        />
      );
    });

    act(() => renderer.root.findByType('input').props.onChange());
    expect(firstPress).not.toHaveBeenCalled();
    expect(secondPress).not.toHaveBeenCalled();

    await act(async () => {
      resolveSecondParse?.(secondDocument);
    });
    act(() => renderer.root.findByType('input').props.onChange());
    expect(secondPress).toHaveBeenCalledWith({
      index: 0,
      checked: true,
      text: 'second',
      taskMarkOffset: 8,
    });

    act(() => renderer.unmount());
  });
});
