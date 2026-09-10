import { updateTaskListMarker } from './updateTaskListMarker';

describe('task-list example source updates', () => {
  it('updates the exact UTF-16 marker reported by the event', () => {
    const markdown = '😀\n- [ ] First\n- [x] Second';

    expect(
      updateTaskListMarker(markdown, {
        checked: true,
        taskMarkOffset: 6,
      })
    ).toBe('😀\n- [x] First\n- [x] Second');
  });

  it('writes the requested unchecked state for uppercase markers', () => {
    expect(
      updateTaskListMarker('- [X] Done', {
        checked: false,
        taskMarkOffset: 3,
      })
    ).toBe('- [ ] Done');
  });

  it.each([-1, 0, 2, 4, 99])(
    'leaves the source unchanged for invalid offset %s',
    (taskMarkOffset) => {
      const markdown = '- [ ] Keep';

      expect(
        updateTaskListMarker(markdown, {
          checked: true,
          taskMarkOffset,
        })
      ).toBe(markdown);
    }
  );
});
