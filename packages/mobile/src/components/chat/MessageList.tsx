import { FlashList, type FlashListRef } from "@shopify/flash-list";
import { useCallback, useRef } from "react";
import { Text, View, StyleSheet } from "react-native";
import { ChatMessage } from "./ChatMessage";
import type { Message } from "./types";
import { OpenChamberLogo } from "../ui/OpenChamberLogo";
import { TextLoop } from "../ui/TextLoop";
import { useTheme, typography } from "@/theme";
import type { TextStyle } from "react-native";

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
	const textColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';

	return (
		<View style={styles.emptyContainer}>
			<OpenChamberLogo width={140} height={140} opacity={0.2} isAnimated />
			<TextLoop
				interval={4}
				style={styles.textLoopContainer}
				textStyle={{ ...typography.uiLabel, ...styles.phraseText, color: textColor } as TextStyle}
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

function LoadingIndicator() {
	const { colors } = useTheme();

	return (
		<View style={styles.loadingContainer}>
			<View style={[styles.loadingBubble, { backgroundColor: colors.card }]}>
				<Text style={[typography.uiLabel, { color: colors.mutedForeground }]}>
					Thinking...
				</Text>
			</View>
		</View>
	);
}

export function MessageList({ messages, isLoading }: MessageListProps) {
	const listRef = useRef<FlashListRef<Message>>(null);

	const renderItem = useCallback(({ item }: { item: Message }) => {
		return <ChatMessage message={item} />;
	}, []);

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
			{...({ estimatedItemSize: 100 } as object)}
			contentContainerStyle={{
				paddingTop: 16,
				paddingBottom: isLoading ? 8 : 16,
			}}
			onContentSizeChange={handleContentSizeChange}
			ListFooterComponent={isLoading ? <LoadingIndicator /> : null}
			showsVerticalScrollIndicator={false}
		/>
	);
}

const styles = StyleSheet.create({
	emptyContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 32,
		gap: 24,
	},
	textLoopContainer: {
		minHeight: 24,
	},
	phraseText: {
		textAlign: 'center',
	},
	loadingContainer: {
		paddingHorizontal: 16,
		paddingVertical: 8,
	},
	loadingBubble: {
		maxWidth: '85%',
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
});
