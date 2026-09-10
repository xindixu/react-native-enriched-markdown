export interface LinkPressEvent {
  url: string;
}

export interface LinkLongPressEvent {
  url: string;
}

export interface TaskListItemPressEvent {
  index: number;
  checked: boolean;
  text: string;
  /** UTF-16 code-unit offset of the marker inside `[ ]`/`[x]`/`[X]` in the exact markdown prop. */
  taskMarkOffset: number;
}

export interface MentionPressEvent {
  url: string;
  text: string;
}

export interface CitationPressEvent {
  url: string;
  text: string;
}

/**
 * Native-level context menu item config sent to the native component.
 * Does not include the `onPress` callback — callbacks are managed on the JS side.
 */
export interface ContextMenuItemConfig {
  text: string;
  icon?: string;
}

/**
 * Event payload fired by the native component when a context menu item is pressed.
 */
export interface OnContextMenuItemPressEvent {
  itemText: string;
  selectedText: string;
  selectionStart: number;
  selectionEnd: number;
}
