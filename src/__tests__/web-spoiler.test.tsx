import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { normalizeMarkdownStyle } from '../normalizeMarkdownStyle.web';
import { parseMarkdown } from '../web/parseMarkdown';
import { RenderNode } from '../web/renderers';
import { buildStyles } from '../web/styles';
import type { ASTNode } from '../web/types';

function nodesOfType(node: ASTNode, type: ASTNode['type']): ASTNode[] {
  return [
    ...(node.type === type ? [node] : []),
    ...(node.children?.flatMap((child) => nodesOfType(child, type)) ?? []),
  ];
}

describe('web spoiler fallback', () => {
  it('renders spoiler contents visibly when overlays are unavailable', async () => {
    const ast = await parseMarkdown('Before ||secret **bold** text|| after', {
      latexMath: false,
    });
    const spoiler = nodesOfType(ast, 'Spoiler')[0]!;
    const style = normalizeMarkdownStyle({});
    let renderer: ReactTestRenderer;

    await act(async () => {
      renderer = create(
        <RenderNode
          node={spoiler}
          style={style}
          styles={buildStyles(style)}
          callbacks={{}}
          capabilities={{ katex: null }}
        />
      );
    });

    expect(renderer!.toJSON()).toMatchObject({
      type: 'span',
      children: ['secret ', { type: 'strong', children: ['bold'] }, ' text'],
    });
    act(() => renderer.unmount());
  });
});
