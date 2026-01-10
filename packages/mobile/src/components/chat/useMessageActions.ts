import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useCallback, useRef, useState } from "react";
import type { View } from "react-native";

export interface MessageLayout {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface UseMessageActionsReturn {
	showMenu: boolean;
	messageLayout: MessageLayout | undefined;
	bubbleRef: React.RefObject<View | null>;
	openMenu: () => Promise<void>;
	closeMenu: () => void;
	copyMessageContent: (content: string) => Promise<void>;
}

export function useMessageActions(): UseMessageActionsReturn {
	const [showMenu, setShowMenu] = useState(false);
	const [messageLayout, setMessageLayout] = useState<MessageLayout | undefined>(undefined);
	const bubbleRef = useRef<View | null>(null);

	const openMenu = useCallback(async () => {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

		// Measure the bubble position
		if (bubbleRef.current) {
			bubbleRef.current.measureInWindow((x, y, width, height) => {
				setMessageLayout({ x, y, width, height });
				setShowMenu(true);
			});
		} else {
			setShowMenu(true);
		}
	}, []);

	const closeMenu = useCallback(() => {
		setShowMenu(false);
		setMessageLayout(undefined);
	}, []);

	const copyMessageContent = useCallback(async (content: string) => {
		await Clipboard.setStringAsync(content);
	}, []);

	return {
		showMenu,
		messageLayout,
		bubbleRef,
		openMenu,
		closeMenu,
		copyMessageContent,
	};
}
