#pragma once

#import "ENRMUIKit.h"

@class StyleConfig;

NS_ASSUME_NONNULL_BEGIN

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
  BOOL found;
  NSInteger index;
  BOOL checked;
  NSRange itemRange;
  NSInteger taskMarkOffset;
} TaskListHitTestResult;

TaskListHitTestResult taskListHitTest(ENRMPlatformTextView *textView, ENRMTapRecognizer *recognizer);

NSRange taskListItemFullRange(ENRMPlatformTextView *textView, NSInteger taskIndex);

NSString *taskListItemText(ENRMPlatformTextView *textView, NSRange itemRange);

BOOL handleTaskListTap(ENRMPlatformTextView *textView, ENRMTapRecognizer *recognizer,
                       void (^handler)(NSInteger index, BOOL checked, NSString *itemText, NSInteger taskMarkOffset));

NSString *toggleTaskListItemAtOffset(NSString *markdown, NSInteger taskMarkOffset, BOOL checked);

BOOL updateTaskListItemCheckedState(ENRMPlatformTextView *textView, NSInteger targetIndex, BOOL newChecked,
                                    StyleConfig *config);

BOOL handleTaskListTapWithSharedLogic(ENRMPlatformTextView *textView, ENRMTapRecognizer *recognizer,
                                      NSString *__strong *cachedMarkdown, StyleConfig *config,
                                      void (^eventEmitterBlock)(NSInteger index, BOOL checked, NSString *itemText,
                                                                NSInteger taskMarkOffset),
                                      void (^renderBlock)(NSString *updatedMarkdown));

#ifdef __cplusplus
}
#endif

NS_ASSUME_NONNULL_END
