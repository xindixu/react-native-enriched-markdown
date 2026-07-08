package com.swmansion.enriched.markdown.utils.text.view

import android.graphics.Color
import android.os.Build
import android.text.Layout
import android.view.textclassifier.TextClassifier
import androidx.appcompat.widget.AppCompatTextView
import androidx.core.view.ViewCompat
import com.swmansion.enriched.markdown.accessibility.AccessibleMarkdownTextView

fun AccessibleMarkdownTextView.setupAsMarkdownTextView() {
  setBackgroundColor(Color.TRANSPARENT)
  includeFontPadding = false
  // Pin line-breaking to match MeasurementStore's StaticLayout exactly.
  // Otherwise the rendered TextView falls back to platform defaults
  // (hyphenation enabled, plus BREAK_STRATEGY_HIGH_QUALITY even on API < 29
  // where the measure path stays SIMPLE), so it wraps to more lines than the
  // measured height reserved for the view — and since a TextView clips instead
  // of scrolling, the tail of long/citation-heavy content is cut off on Android.
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
    breakStrategy = Layout.BREAK_STRATEGY_HIGH_QUALITY
    hyphenationFrequency = Layout.HYPHENATION_FREQUENCY_NONE
  }
  movementMethod = LinkLongPressMovementMethod.createInstance()
  setTextIsSelectable(true)
  customSelectionActionModeCallback = createSelectionActionModeCallback(this)
  // SmartSelectSprite crashes with "Center point is not inside any of the
  // rectangles!" when Layout.getSelection returns empty rects near an
  // ImageSpan (ReplacementSpan). NO_OP makes skipTextClassification() return
  // true, bypassing the entire SmartSelectSprite code path. Regular text
  // selection (long-press, handles, copy/paste) still works; only automatic
  // entity detection (phone numbers, addresses) is disabled.
  //
  // TODO: Add an Android-only `enableSmartTextSelection` prop that skips this
  // NO_OP override. This would let users who don't render images opt in to
  // entity detection. The prop should default to false and its docs should
  // warn that enabling it with markdown containing images will crash.
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
    setTextClassifier(TextClassifier.NO_OP)
  }
  isVerticalScrollBarEnabled = false
  isHorizontalScrollBarEnabled = false
  ViewCompat.setAccessibilityDelegate(this, accessibilityHelper)
}

fun AppCompatTextView.applySelectableState(selectable: Boolean) {
  if (isTextSelectable == selectable) return
  setTextIsSelectable(selectable)
  movementMethod = LinkLongPressMovementMethod.createInstance()
  if (!selectable && !isClickable) isClickable = true
}
