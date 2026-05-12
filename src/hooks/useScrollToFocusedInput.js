import { useEffect, useRef, useCallback } from "react";
import { Keyboard, TextInput, Dimensions } from "react-native";

// Scrolls the ScrollView so the currently focused TextInput stays above the
// keyboard. Works with New Architecture (uses HostInstance, not findNodeHandle).
// bottomOffset: height of any sticky footer above the keyboard (measured via onLayout).
export function useScrollToFocusedInput(scrollRef, bottomOffset = 0) {
    const scrollY = useRef(0);
    const kbHeight = useRef(0);
    const bottomOffsetRef = useRef(bottomOffset);
    bottomOffsetRef.current = bottomOffset;

    const scrollToFocused = useCallback(() => {
        const input = TextInput.State.currentlyFocusedInput();
        if (!input || !scrollRef.current || !kbHeight.current) return;
        input.measureInWindow((x, y, w, h) => {
            const windowHeight = Dimensions.get("window").height;
            const inputBottom = y + h + 20; // 20px breathing room
            const visibleBottom = windowHeight - kbHeight.current - bottomOffsetRef.current;
            if (inputBottom > visibleBottom) {
                scrollRef.current?.scrollTo({
                    y: scrollY.current + (inputBottom - visibleBottom),
                    animated: true,
                });
            }
        });
    }, [scrollRef]);

    useEffect(() => {
        const show = Keyboard.addListener("keyboardDidShow", (e) => {
            kbHeight.current = e.endCoordinates.height;
            setTimeout(scrollToFocused, 50);
        });
        const hide = Keyboard.addListener("keyboardDidHide", () => {
            kbHeight.current = 0;
        });
        return () => {
            show.remove();
            hide.remove();
        };
    }, [scrollToFocused]);

    return {
        onScroll: (e) => { scrollY.current = e.nativeEvent.contentOffset.y; },
        scrollEventThrottle: 16,
    };
}
