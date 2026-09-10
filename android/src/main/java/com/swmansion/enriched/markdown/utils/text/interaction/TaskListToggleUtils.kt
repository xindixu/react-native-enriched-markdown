package com.swmansion.enriched.markdown.utils.text.interaction

object TaskListToggleUtils {
  fun toggleAtOffset(
    markdown: String,
    taskMarkOffset: Int,
    checked: Boolean,
  ): String {
    if (taskMarkOffset <= 0 || taskMarkOffset >= markdown.length - 1) return markdown
    if (markdown[taskMarkOffset - 1] != '[' || markdown[taskMarkOffset + 1] != ']') return markdown
    when (markdown[taskMarkOffset]) {
      ' ', 'x', 'X' -> Unit
      else -> return markdown
    }
    return markdown.replaceRange(taskMarkOffset, taskMarkOffset + 1, if (checked) "x" else " ")
  }
}
