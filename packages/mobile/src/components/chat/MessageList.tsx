import { FlashList, type FlashListRef } from "@shopify/flash-list";
import { useCallback, useRef } from "react";
import type { TextStyle } from "react-native";
import { StyleSheet, Text, View } from "react-native";
import { typography, useTheme } from "@/theme";
import { OpenChamberLogo } from "../ui/OpenChamberLogo";
import { TextLoop } from "../ui/TextLoop";
import { ChatMessage } from "./ChatMessage";
import type { Message } from "./types";

type MessageListProps = {
	messages: Message[];
	isLoading?: boolean;
};

const phrases = [
	"Fix the failing tests",
	"Refactor this to be more readable",
	"Add form validation",
	"Optimize this function",
	"Write tests for this",
	"Explain how this works",
	"Add a new feature",
	"Help me debug this",
	"Review my code",
	"Simplify this logic",
	"Add error handling",
	"Create a new component",
	"Update the documentation",
	"Find the bug here",
	"Improve performance",
	"Add type definitions",
];

function EmptyState() {
	const { isDark } = useTheme();
	const textColor = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)";

	return (
		<View style={styles.emptyContainer}>
			<OpenChamberLogo width={120} height={120} opacity={0.15} isAnimated />
			<TextLoop
				interval={4}
				style={styles.textLoopContainer}
				textStyle={
					{
						...typography.uiLabel,
						...styles.phraseText,
						color: textColor,
					} as TextStyle
				}
			>
				{phrases.map((phrase) => (
					<Text key={phrase} style={[typography.uiLabel, { color: textColor }]}>
						"{phrase}..."
					</Text>
				))}
			</TextLoop>
		</View>
	);
}

export function MessageList({ messages, isLoading }: MessageListProps) {
	const listRef = useRef<FlashListRef<Message>>(null);

	const renderItem = useCallback(
		({ item, index }: { item: Message; index: number }) => {
			// Determine if we should show header based on previous message
			const previousMessage = index > 0 ? messages[index - 1] : null;
			const showHeader = !previousMessage || previousMessage.role === "user";

			return <ChatMessage message={item} showHeader={showHeader} />;
		},
		[messages],
	);

	const keyExtractor = useCallback((item: Message) => item.id, []);

	const handleContentSizeChange = useCallback(() => {
		if (messages.length > 0) {
			listRef.current?.scrollToEnd({ animated: true });
		}
	}, [messages.length]);

	if (messages.length === 0 && !isLoading) {
		return <EmptyState />;
	}

	return (
		<FlashList
			ref={listRef}
			data={messages}
			renderItem={renderItem}
			keyExtractor={keyExtractor}
			extraData={messages}
			{...({ estimatedItemSize: 120 } as object)}
			contentContainerStyle={styles.listContent}
			onContentSizeChange={handleContentSizeChange}
			showsVerticalScrollIndicator={false}
		/>
	);
}

const styles = StyleSheet.create({
	emptyContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 32,
		gap: 20,
	},
	textLoopContainer: {
		minHeight: 24,
	},
	phraseText: {
		textAlign: "center",
	},
	listContent: {
		paddingTop: 12,
		paddingBottom: 16,
	},
});
