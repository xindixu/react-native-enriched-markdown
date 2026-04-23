import { type OnLinkDetected } from './EnrichedMarkdownTextInputNativeComponent';
export type { OnLinkDetected } from './EnrichedMarkdownTextInputNativeComponent';
import type { HostInstance, ViewStyle, TextStyle, ColorValue } from 'react-native';
import type { RefObject } from 'react';
export interface MarkdownTextInputStyle {
    strong?: {
        color?: string;
    };
    em?: {
        color?: string;
    };
    link?: {
        color?: string;
        underline?: boolean;
    };
    spoiler?: {
        color?: string;
        backgroundColor?: string;
    };
}
export interface StyleState {
    bold: {
        isActive: boolean;
    };
    italic: {
        isActive: boolean;
    };
    underline: {
        isActive: boolean;
    };
    strikethrough: {
        isActive: boolean;
    };
    spoiler: {
        isActive: boolean;
    };
    link: {
        isActive: boolean;
    };
}
export interface ContextMenuItem {
    text: string;
    onPress: (event: {
        text: string;
        selection: {
            start: number;
            end: number;
        };
        styleState: StyleState;
    }) => void;
    icon?: string;
    visible?: boolean;
}
export interface CaretRect {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface EnrichedMarkdownTextInputInstance {
    focus: () => void;
    blur: () => void;
    measure: HostInstance['measure'];
    measureInWindow: HostInstance['measureInWindow'];
    measureLayout: HostInstance['measureLayout'];
    setValue: (markdown: string) => void;
    setSelection: (start: number, end: number) => void;
    toggleBold: () => void;
    toggleItalic: () => void;
    toggleUnderline: () => void;
    toggleStrikethrough: () => void;
    toggleSpoiler: () => void;
    setLink: (url: string) => void;
    insertLink: (text: string, url: string) => void;
    removeLink: () => void;
    getMarkdown: () => Promise<string>;
    getCaretRect: () => Promise<CaretRect>;
}
export interface EnrichedMarkdownTextInputProps {
    ref?: RefObject<EnrichedMarkdownTextInputInstance | null>;
    defaultValue?: string;
    placeholder?: string;
    placeholderTextColor?: ColorValue;
    editable?: boolean;
    autoFocus?: boolean;
    scrollEnabled?: boolean;
    autoCapitalize?: string;
    multiline?: boolean;
    cursorColor?: ColorValue;
    selectionColor?: ColorValue;
    markdownStyle?: MarkdownTextInputStyle;
    style?: ViewStyle | TextStyle;
    onChangeText?: (text: string) => void;
    onChangeMarkdown?: (markdown: string) => void;
    onChangeSelection?: (selection: {
        start: number;
        end: number;
    }) => void;
    onChangeState?: (state: StyleState) => void;
    onCaretRectChange?: (rect: CaretRect) => void;
    onLinkDetected?: (event: OnLinkDetected) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    contextMenuItems?: ContextMenuItem[];
    linkRegex?: RegExp | null;
}
export declare const EnrichedMarkdownTextInput: ({ ref, markdownStyle, style, defaultValue, placeholder, placeholderTextColor, editable, autoFocus, scrollEnabled, autoCapitalize, multiline, cursorColor, selectionColor, onChangeText, onChangeMarkdown, onChangeSelection, onChangeState, onCaretRectChange, onLinkDetected, onFocus, onBlur, contextMenuItems, linkRegex: _linkRegex, }: EnrichedMarkdownTextInputProps) => import("react/jsx-runtime").JSX.Element;
export default EnrichedMarkdownTextInput;
//# sourceMappingURL=EnrichedMarkdownTextInput.d.ts.map