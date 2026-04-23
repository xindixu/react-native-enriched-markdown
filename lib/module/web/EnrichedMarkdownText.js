"use strict";

import { useState, useEffect, useMemo, useCallback, Fragment } from 'react';
import { normalizeMarkdownStyle } from "../normalizeMarkdownStyle.web.js";
import { zeroTrailingMargins, parseErrorFallbackStyle, buildStyles } from "./styles.js";
import { parseMarkdown } from "./parseMarkdown.js";
import { RenderNode } from "./renderers/index.js";
import { CITATION_CLASS } from "./renderers/InlineRenderers.js";
import { indexTaskItems, markInlineImages } from "./utils.js";
import { loadKaTeX } from "./katex.js";
import { normalizeColor } from "../styleUtils.js";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const EnrichedMarkdownText = ({
  markdown,
  markdownStyle = {},
  md4cFlags = {},
  onLinkPress,
  onLinkLongPress,
  onTaskListItemPress,
  onMentionPress,
  onCitationPress,
  allowTrailingMargin = false,
  containerStyle,
  selectable = true,
  dir,
  selectionColor,
  ...rest
}) => {
  const normalizedStyle = useMemo(() => normalizeMarkdownStyle(markdownStyle), [markdownStyle]);
  const [ast, setAst] = useState(null);
  const [katex, setKatex] = useState(null);
  const [parseError, setParseError] = useState(false);
  const {
    underline = false,
    latexMath = true
  } = md4cFlags;
  useEffect(() => {
    let cancelled = false;
    const katexPromise = latexMath ? loadKaTeX() : Promise.resolve(null);
    Promise.all([parseMarkdown(markdown, {
      underline,
      latexMath
    }), katexPromise]).then(([result, katexInstance]) => {
      if (!cancelled) {
        indexTaskItems(result);
        markInlineImages(result);
        setParseError(false);
        setKatex(katexInstance);
        setAst(result);
      }
    }).catch(error => {
      if (!cancelled) {
        if (__DEV__) {
          console.error('[EnrichedMarkdownText] Parse failed:', error);
        }
        setParseError(true);
        setAst(null);
        setKatex(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [markdown, underline, latexMath]);
  const callbacks = useMemo(() => ({
    onLinkPress,
    onLinkLongPress,
    onTaskListItemPress,
    onMentionPress,
    onCitationPress
  }), [onLinkPress, onLinkLongPress, onTaskListItemPress, onMentionPress, onCitationPress]);
  const capabilities = useMemo(() => ({
    katex
  }), [katex]);
  const lastChildStyle = useMemo(() => allowTrailingMargin ? normalizedStyle : zeroTrailingMargins(normalizedStyle), [normalizedStyle, allowTrailingMargin]);
  const styles = useMemo(() => buildStyles(normalizedStyle), [normalizedStyle]);
  const lastChildStyles = useMemo(() => buildStyles(lastChildStyle), [lastChildStyle]);
  const wrapperStyle = useMemo(() => {
    const selectionColorCss = selectionColor ? normalizeColor(String(selectionColor)) : undefined;
    return {
      display: 'flex',
      flexDirection: 'column',
      ...containerStyle,
      ...(selectable ? undefined : {
        userSelect: 'none'
      }),
      ...(selectionColorCss != null ? {
        ['--enrm-selection-bg']: selectionColorCss
      } : null)
    };
  }, [containerStyle, selectable, selectionColor]);
  const selectionStyle = selectionColor ? /*#__PURE__*/_jsx("style", {
    children: `[data-enriched-markdown-text] ::selection {
    background-color: var(--enrm-selection-bg);
    }`
  }) : null;

  // The browser's default copy picks up the text content of the selected
  // DOM, which would include citation markers. Citations are reference
  // metadata, not prose, so we rewrite the plain-text flavor to elide them
  // while keeping the HTML flavor intact for rich-text destinations.
  //
  // Mentions render a tiny sibling <style> for :active opacity; cloneContents
  // includes it and textContent would concatenate its CSS, so we strip
  // <style> from the copy fragment as well.
  //
  // DOM types aren't in the tsconfig lib list, so we narrow through
  // locally-scoped interfaces to access only the few APIs we need.
  const handleCopy = useCallback(event => {
    const root = event.currentTarget;
    const native = event.nativeEvent;
    const clipboardRaw = event.clipboardData ?? native?.clipboardData;
    const clipboardData = clipboardRaw;
    if (typeof clipboardData?.setData !== 'function') {
      return;
    }
    const doc = root.ownerDocument;
    const win = doc?.defaultView;
    if (!doc || !win) return;
    const selection = win.getSelection?.();
    if (!selection || typeof selection.rangeCount !== 'number' || selection.rangeCount === 0) {
      return;
    }

    // Cast: lib is ES-only; Range lives on the browser document.
    const raw = selection.getRangeAt(0);
    if (raw.collapsed) return;

    // Restrict to this markdown root so a selection that also covers siblings
    // or parents is not default-serialized with the outer wrapper in HTML.
    const inner = doc.createRange();
    inner.selectNodeContents(root);
    const START_TO_START = 0;
    const START_TO_END = 1;
    const END_TO_END = 2;
    const END_TO_START = 3;
    const r0 = raw.cloneRange();
    if (r0.compareBoundaryPoints(END_TO_START, inner) <= 0) return;
    if (r0.compareBoundaryPoints(START_TO_END, inner) >= 0) return;
    const range = raw.cloneRange();
    if (range.compareBoundaryPoints(START_TO_START, inner) < 0) {
      range.setStart(inner.startContainer, inner.startOffset);
    }
    if (range.compareBoundaryPoints(END_TO_END, inner) > 0) {
      range.setEnd(inner.endContainer, inner.endOffset);
    }
    const container = doc.createElement('div');
    container.appendChild(range.cloneContents());
    for (const node of container.querySelectorAll('style')) {
      node.remove();
    }
    for (const node of container.querySelectorAll(`.${CITATION_CLASS}`)) {
      node.remove();
    }

    // Cancel the default *before* setData: if setData threw before, the
    // default copy would still run and paste the full outer div + unfiltered HTML.
    event.preventDefault();
    event.stopPropagation();
    clipboardData.setData('text/plain', container.textContent ?? '');
    clipboardData.setData('text/html', container.innerHTML);
  }, []);
  if (parseError) {
    return /*#__PURE__*/_jsxs(Fragment, {
      children: [selectionStyle, /*#__PURE__*/_jsx("div", {
        "data-enriched-markdown-text": true,
        style: wrapperStyle,
        dir: dir,
        ...rest,
        children: /*#__PURE__*/_jsx("pre", {
          style: parseErrorFallbackStyle,
          children: markdown
        })
      })]
    });
  }
  if (!ast) return null;
  const children = ast.children ?? [];
  const lastIdx = children.length - 1;
  return /*#__PURE__*/_jsxs(Fragment, {
    children: [selectionStyle, /*#__PURE__*/_jsx("div", {
      "data-enriched-markdown-text": true,
      style: wrapperStyle,
      dir: dir,
      onCopy: handleCopy,
      ...rest,
      children: children.map((child, index) => /*#__PURE__*/_jsx(RenderNode, {
        node: child,
        style: index === lastIdx ? lastChildStyle : normalizedStyle,
        styles: index === lastIdx ? lastChildStyles : styles,
        callbacks: callbacks,
        capabilities: capabilities
      }, `${child.type}-${index}`))
    })]
  });
};
export default EnrichedMarkdownText;
//# sourceMappingURL=EnrichedMarkdownText.js.map