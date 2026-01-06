import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useState } from "react";

export interface UseMessageActionsReturn {
	showMenu: boolean;
	openMenu: () => Promise<void>;
	closeMenu: () => void;
	copyMessageContent: (content: string) => Promise<void>;
}

export function useMessageActions(): UseMessageActionsReturn {
	const [showMenu, setShowMenu] = useState(false);

	const openMenu = async () => {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		setShowMenu(true);
	};

	const closeMenu = () => {
		setShowMenu(false);
	};

	const copyMessageContent = async (content: string) => {
		await Clipboard.setStringAsync(content);
	};

	return {
		showMenu,
		openMenu,
		closeMenu,
		copyMessageContent,
	};
}
