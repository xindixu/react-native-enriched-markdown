import { type ColorValue } from 'react-native';
import type { MarkdownTextInputStyle } from './EnrichedMarkdownTextInput';
interface MarkdownTextInputStyleInternal {
    strong: {
        color?: ColorValue;
    };
    em: {
        color?: ColorValue;
    };
    link: {
        color: ColorValue;
        underline: boolean;
    };
    spoiler: {
        color: ColorValue;
        backgroundColor: ColorValue;
    };
}
export declare const normalizeMarkdownTextInputStyle: (style?: MarkdownTextInputStyle) => MarkdownTextInputStyleInternal;
export {};
//# sourceMappingURL=normalizeMarkdownTextInputStyle.d.ts.map