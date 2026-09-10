export interface TaskListToggle {
  checked: boolean;
  taskMarkOffset: number;
}

export function updateTaskListMarker(
  markdown: string,
  { checked, taskMarkOffset }: TaskListToggle
): string {
  if (
    !Number.isInteger(taskMarkOffset) ||
    taskMarkOffset <= 0 ||
    taskMarkOffset >= markdown.length - 1 ||
    markdown[taskMarkOffset - 1] !== '[' ||
    markdown[taskMarkOffset + 1] !== ']' ||
    ![' ', 'x', 'X'].includes(markdown[taskMarkOffset] ?? '')
  ) {
    return markdown;
  }

  return `${markdown.slice(0, taskMarkOffset)}${checked ? 'x' : ' '}${markdown.slice(taskMarkOffset + 1)}`;
}
