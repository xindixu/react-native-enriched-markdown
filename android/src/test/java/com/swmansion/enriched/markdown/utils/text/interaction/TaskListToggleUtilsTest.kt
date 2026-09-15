package com.swmansion.enriched.markdown.utils.text.interaction

import org.junit.Assert.assertEquals
import org.junit.Test

class TaskListToggleUtilsTest {
  @Test
  fun updatesOnlyTheMarkerAtTheUtf16Offset() {
    val cases =
      listOf(
        Triple("- [ ] plan", 3, "- [x] plan"),
        Triple("😀\n- [ ] ship", 6, "😀\n- [x] ship"),
        Triple("> - [ ] quote", 5, "> - [x] quote"),
        Triple("1. [ ] ordered", 4, "1. [x] ordered"),
        Triple("- [ ] outer\n  - [ ] inner", 17, "- [ ] outer\n  - [x] inner"),
        Triple("```\n- [ ] fake\n```\n- [ ] real", 22, "```\n- [ ] fake\n```\n- [x] real"),
        Triple("- [ ] first\r\n- [ ] second\r\n", 16, "- [ ] first\r\n- [x] second\r\n"),
      )

    for ((markdown, offset, expected) in cases) {
      assertEquals(markdown, expected, TaskListToggleUtils.toggleAtOffset(markdown, offset, true))
    }
  }

  @Test
  fun checkedIsTheRequestedNewState() {
    assertEquals("- [ ] done", TaskListToggleUtils.toggleAtOffset("- [x] done", 3, false))
    assertEquals("- [ ] done", TaskListToggleUtils.toggleAtOffset("- [X] done", 3, false))
    assertEquals("- [x] done", TaskListToggleUtils.toggleAtOffset("- [X] done", 3, true))
    assertEquals("- [x] done", TaskListToggleUtils.toggleAtOffset("- [x] done", 3, true))
  }

  @Test
  fun invalidOrStaleOffsetsLeaveSourceUnchanged() {
    val cases =
      listOf(
        "" to 0,
        "- [ ] plan" to -1,
        "- [ ] plan" to 0,
        "- [ ] plan" to 2,
        "- [ ] plan" to 4,
        "- [ ] plan" to 9,
        "- [ ] plan" to 10,
        "- [ ] plan" to Int.MAX_VALUE,
        "- ( ] plan" to 3,
        "- [ ) plan" to 3,
        "- [?] plan" to 3,
        "- [y] plan" to 3,
        "- [\t] plan" to 3,
      )

    for ((markdown, offset) in cases) {
      assertEquals(markdown, markdown, TaskListToggleUtils.toggleAtOffset(markdown, offset, true))
    }
  }
}
