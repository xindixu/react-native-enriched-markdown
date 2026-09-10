import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  EnrichedMarkdownText,
  type TaskListItemPressEvent,
} from 'react-native-enriched-markdown';
import { updateTaskListMarker } from './updateTaskListMarker';

const initialMarkdown = `😀 UTF-16 prefix
- [ ] First task
- [x] Already completed
  - [ ] Nested task
1. [ ] Ordered task
> - [ ] Blockquoted task`;

export function TaskListDemo() {
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [lastEvent, setLastEvent] = useState<TaskListItemPressEvent | null>(
    null
  );

  const handleTaskListItemPress = useCallback(
    (event: TaskListItemPressEvent) => {
      setMarkdown((source) => updateTaskListMarker(source, event));
      setLastEvent(event);
    },
    []
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Task-list toggle persistence</Text>
      <Text style={styles.instructions}>
        Tap a checkbox. The event updates the exact marker in the Markdown
        source below.
      </Text>

      <EnrichedMarkdownText
        flavor="github"
        markdown={markdown}
        onTaskListItemPress={handleTaskListItemPress}
      />

      <Text style={styles.label}>Last event</Text>
      <Text selectable style={styles.eventValue}>
        {lastEvent
          ? `index=${lastEvent.index} checked=${lastEvent.checked} taskMarkOffset=${lastEvent.taskMarkOffset}`
          : 'Tap a checkbox to emit an event'}
      </Text>

      <Text style={styles.label}>Current Markdown</Text>
      <Text selectable style={styles.source}>
        {markdown}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  title: {
    marginBottom: 4,
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  instructions: {
    marginBottom: 12,
    color: '#4B5563',
    fontSize: 13,
  },
  label: {
    marginTop: 16,
    marginBottom: 4,
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  eventValue: {
    color: '#047857',
    fontFamily: 'monospace',
    fontSize: 12,
  },
  source: {
    borderRadius: 4,
    padding: 12,
    color: '#374151',
    backgroundColor: '#E5E7EB',
    fontFamily: 'monospace',
    fontSize: 12,
  },
});
