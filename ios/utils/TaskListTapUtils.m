#import "TaskListTapUtils.h"
#import "ENRMUIKit.h"
#import "ListItemRenderer.h"
#import "StyleConfig.h"
#import <React/RCTI18nUtil.h>
#include <TargetConditionals.h>

TaskListHitTestResult taskListHitTest(ENRMPlatformTextView *textView, ENRMTapRecognizer *recognizer)
{
  const TaskListHitTestResult notFound = {
      .found = NO, .index = 0, .checked = NO, .itemRange = {0, 0}, .taskMarkOffset = -1};

  NSLayoutManager *layoutManager = textView.layoutManager;
  NSTextContainer *textContainer = textView.textContainer;
  CGPoint tapPoint = [recognizer locationInView:textView];

  NSUInteger glyphIndex = [layoutManager glyphIndexForPoint:tapPoint inTextContainer:textContainer];
  NSUInteger charIndex = [layoutManager characterIndexForGlyphAtIndex:glyphIndex];

  NSAttributedString *attrText = ENRMGetAttributedText(textView);
  if (charIndex >= attrText.length) {
    return notFound;
  }

  NSDictionary *attributes = [attrText attributesAtIndex:charIndex effectiveRange:NULL];
  BOOL isTaskItem = [attributes[TaskItemAttribute] boolValue];

  if (!isTaskItem) {
    return notFound;
  }

  NSParagraphStyle *style = attributes[NSParagraphStyleAttributeName];
  CGFloat checkboxWidth = style ? style.firstLineHeadIndent : 0;

  BOOL isRTL = [[RCTI18nUtil sharedInstance] isRTL];
  if (isRTL) {
    CGFloat viewWidth = textView.bounds.size.width;
    if (tapPoint.x <= viewWidth - checkboxWidth) {
      return notFound;
    }
  } else {
    if (tapPoint.x >= checkboxWidth) {
      return notFound;
    }
  }

  NSInteger taskIndex = [attributes[TaskIndexAttribute] integerValue];

  NSRange fullItemRange = taskListItemFullRange(textView, taskIndex);

  if (fullItemRange.location == NSNotFound) {
    [attrText attribute:TaskItemAttribute atIndex:charIndex effectiveRange:&fullItemRange];
  }

  return (TaskListHitTestResult){
      .found = YES,
      .index = taskIndex,
      .checked = [attributes[TaskCheckedAttribute] boolValue],
      .itemRange = fullItemRange,
      .taskMarkOffset = attributes[TaskMarkOffsetAttribute] ? [attributes[TaskMarkOffsetAttribute] integerValue] : -1};
}

NSRange taskListItemFullRange(ENRMPlatformTextView *textView, NSInteger taskIndex)
{
  NSAttributedString *attrText = ENRMGetAttributedText(textView);
  __block NSRange fullItemRange = NSMakeRange(NSNotFound, 0);
  [attrText enumerateAttribute:TaskIndexAttribute
                       inRange:NSMakeRange(0, attrText.length)
                       options:0
                    usingBlock:^(id value, NSRange range, BOOL *stop) {
                      if (value && [value integerValue] == taskIndex) {
                        NSDictionary *rangeAttrs = [attrText attributesAtIndex:range.location effectiveRange:NULL];
                        if ([rangeAttrs[TaskItemAttribute] boolValue]) {
                          if (fullItemRange.location == NSNotFound) {
                            fullItemRange = range;
                          } else {
                            NSUInteger newStart = MIN(fullItemRange.location, range.location);
                            NSUInteger newEnd = MAX(NSMaxRange(fullItemRange), NSMaxRange(range));
                            fullItemRange = NSMakeRange(newStart, newEnd - newStart);
                          }
                        }
                      }
                    }];

  return fullItemRange;
}

NSString *taskListItemText(ENRMPlatformTextView *textView, NSRange itemRange)
{
  NSAttributedString *attrString = ENRMGetAttributedText(textView);
  NSUInteger textLength = attrString.length;

  if (itemRange.location >= textLength || itemRange.length == 0) {
    return @"";
  }

  NSUInteger safeEnd = MIN(NSMaxRange(itemRange), textLength);
  NSRange safeRange = NSMakeRange(itemRange.location, safeEnd - itemRange.location);

  NSString *sourceString = attrString.string;

  NSRange newlineRange = [sourceString rangeOfString:@"\n" options:0 range:safeRange];

  NSRange finalRange = safeRange;
  if (newlineRange.location != NSNotFound) {
    finalRange.length = newlineRange.location - safeRange.location;
  }

  NSString *result = [sourceString substringWithRange:finalRange];
  return [result stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
}

BOOL handleTaskListTap(ENRMPlatformTextView *textView, ENRMTapRecognizer *recognizer,
                       void (^handler)(NSInteger index, BOOL checked, NSString *itemText, NSInteger taskMarkOffset))
{
  TaskListHitTestResult hit = taskListHitTest(textView, recognizer);
  if (!hit.found)
    return NO;

  NSString *itemText = taskListItemText(textView, hit.itemRange);
  handler(hit.index, hit.checked, itemText, hit.taskMarkOffset);
  return YES;
}

NSString *toggleTaskListItemAtOffset(NSString *markdown, NSInteger taskMarkOffset, BOOL checked)
{
  if (taskMarkOffset <= 0 || markdown.length < 3 || (NSUInteger)taskMarkOffset >= markdown.length - 1) {
    return markdown;
  }
  if ([markdown characterAtIndex:taskMarkOffset - 1] != '[' || [markdown characterAtIndex:taskMarkOffset + 1] != ']') {
    return markdown;
  }
  unichar marker = [markdown characterAtIndex:taskMarkOffset];
  if (marker != ' ' && marker != 'x' && marker != 'X') {
    return markdown;
  }
  return [markdown stringByReplacingCharactersInRange:NSMakeRange(taskMarkOffset, 1) withString:checked ? @"x" : @" "];
}

BOOL updateTaskListItemCheckedState(ENRMPlatformTextView *textView, NSInteger targetIndex, BOOL newChecked,
                                    StyleConfig *config)
{
  NSAttributedString *originalText = ENRMGetAttributedText(textView);
  if (!originalText)
    return NO;

  NSRange targetItemRange = taskListItemFullRange(textView, targetIndex);
  if (targetItemRange.location == NSNotFound)
    return NO;

  NSDictionary *attrs = [originalText attributesAtIndex:targetItemRange.location effectiveRange:NULL];
  NSInteger nestingLevel = [attrs[ListDepthAttribute] integerValue] ?: 0;

  NSMutableAttributedString *mutableText = [originalText mutableCopy];

  RCTUIColor *checkedColor = [config taskListCheckedTextColor];
  RCTUIColor *listStyleColor = [config listStyleColor];
  BOOL shouldStrikethrough = [config taskListCheckedStrikethrough];

  [mutableText
      enumerateAttribute:ListDepthAttribute
                 inRange:targetItemRange
                 options:0
              usingBlock:^(NSNumber *depth, NSRange segmentRange, BOOL *stop) {
                if (depth && [depth integerValue] > nestingLevel)
                  return;

                [mutableText addAttribute:TaskCheckedAttribute value:@(newChecked) range:segmentRange];

                if (newChecked) {
                  if (checkedColor) {
                    [mutableText addAttribute:NSForegroundColorAttributeName value:checkedColor range:segmentRange];
                  }
                  if (shouldStrikethrough) {
                    [mutableText addAttribute:NSStrikethroughStyleAttributeName
                                        value:@(NSUnderlineStyleSingle)
                                        range:segmentRange];
                    [mutableText addAttribute:NSStrikethroughColorAttributeName
                                        value:(checkedColor ?: listStyleColor)range:segmentRange];
                  }
                } else {
                  [mutableText removeAttribute:NSStrikethroughStyleAttributeName range:segmentRange];
                  [mutableText removeAttribute:NSStrikethroughColorAttributeName range:segmentRange];
                  if (listStyleColor) {
                    [mutableText addAttribute:NSForegroundColorAttributeName value:listStyleColor range:segmentRange];
                  } else {
                    [mutableText removeAttribute:NSForegroundColorAttributeName range:segmentRange];
                  }
                }
              }];

  ENRMSetAttributedText(textView, mutableText);
  NSLayoutManager *layoutManager = textView.layoutManager;
  if (layoutManager) {
    [layoutManager invalidateLayoutForCharacterRange:targetItemRange actualCharacterRange:NULL];
    [layoutManager invalidateDisplayForCharacterRange:targetItemRange];
  }
  ENRMSetNeedsDisplay(textView);

  return YES;
}

BOOL handleTaskListTapWithSharedLogic(ENRMPlatformTextView *textView, ENRMTapRecognizer *recognizer,
                                      NSString *__strong *cachedMarkdown, StyleConfig *config,
                                      void (^eventEmitterBlock)(NSInteger index, BOOL checked, NSString *itemText,
                                                                NSInteger taskMarkOffset),
                                      void (^renderBlock)(NSString *updatedMarkdown))
{
  return handleTaskListTap(
      textView, recognizer, ^(NSInteger index, BOOL checked, NSString *itemText, NSInteger taskMarkOffset) {
        BOOL newChecked = !checked;

        NSString *updatedMarkdown = toggleTaskListItemAtOffset(*cachedMarkdown, taskMarkOffset, newChecked);
        *cachedMarkdown = updatedMarkdown;

        if (updateTaskListItemCheckedState(textView, index, newChecked, config)) {
          eventEmitterBlock(index, newChecked, itemText, taskMarkOffset);
        } else {
          renderBlock(updatedMarkdown);
          eventEmitterBlock(index, newChecked, itemText, taskMarkOffset);
        }
      });
}
