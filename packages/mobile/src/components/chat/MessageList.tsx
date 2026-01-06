import { FlashList, type FlashListRef } from "@shopify/flash-list";
import * as Haptics from "expo-haptics";
import { useCallback, useRef, useState } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent, TextStyle } from "react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { typography, useTheme } from "@/theme";
import { OpenChamberLogo } from "../ui/OpenChamberLogo";
import { TextLoop } from "../ui/TextLoop";
import { ChatMessage } from "./ChatMessage";
import type { Message } from "./types";

// Arrow down icon for scroll-to-bottom button
function ArrowDownIcon({ color, size = 16 }: { color: string; size?: number }) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Path
				d="M12 5v14M19 12l-7 7-7-7"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

type MessageListProps = {
	messages: Message[];
	isLoading?: boolean;
	onRevert?: (messageId: string) => void;
	onFork?: (messageId: string) => void;
	onSelectSession?: (sessionId: string) => void;
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

export function MessageList({ messages, isLoading, onRevert, onFork, onSelectSession }: MessageListProps) {
	const { colors } = useTheme();
	const listRef = useRef<FlashListRef<Message>>(null);
	const [showScrollButton, setShowScrollButton] = useState(false);

	const renderItem = useCallback(
		({ item, index }: { item: Message; index: number }) => {
			// Determine if we should show header based on previous message
			const previousMessage = index > 0 ? messages[index - 1] : null;
			const showHeader = !previousMessage || previousMessage.role === "user";

			return (
				<ChatMessage
					message={item}
					showHeader={showHeader}
					onRevert={onRevert}
					onBranchSession={onFork}
					onSelectSession={onSelectSession}
				/>
			);
		},
		[messages, onRevert, onFork, onSelectSession],
	);

	const keyExtractor = useCallback((item: Message) => item.id, []);

	const handleContentSizeChange = useCallback(() => {
		if (messages.length > 0 && !showScrollButton) {
			listRef.current?.scrollToEnd({ animated: true });
		}
	}, [messages.length, showScrollButton]);

	const handleScroll = useCallback(
		(event: NativeSyntheticEvent<NativeScrollEvent>) => {
			const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
			const distanceFromBottom =
				contentSize.height - layoutMeasurement.height - contentOffset.y;
			// Show button when scrolled more than 100px from bottom
			setShowScrollButton(distanceFromBottom > 100);
		},
		[],
	);

	const scrollToBottom = useCallback(() => {
		Haptics.selectionAsync();
		listRef.current?.scrollToEnd({ animated: true });
	}, []);

	if (messages.length === 0 && !isLoading) {
		return <EmptyState />;
	}

	return (
		<View style={styles.container}>
			<FlashList
				ref={listRef}
				data={messages}
				renderItem={renderItem}
				keyExtractor={keyExtractor}
				extraData={messages}
				{...({ estimatedItemSize: 120 } as object)}
				contentContainerStyle={styles.listContent}
				onContentSizeChange={handleContentSizeChange}
				onScroll={handleScroll}
				scrollEventThrottle={16}
				showsVerticalScrollIndicator={false}
			/>
			{/* Scroll-to-bottom button */}
			{showScrollButton && messages.length > 0 && (
				<Pressable
					onPress={scrollToBottom}
					style={({ pressed }) => [
						styles.scrollToBottomButton,
						{
							backgroundColor: colors.background,
							borderColor: colors.border,
							opacity: pressed ? 0.8 : 1,
						},
					]}
				>
					<ArrowDownIcon color={colors.foreground} size={16} />
				</Pressable>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		position: "relative",
	},
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
	scrollToBottomButton: {
		position: "absolute",
		bottom: 12,
		alignSelf: "center",
		width: 36,
		height: 36,
		borderRadius: 18,
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 8,
		elevation: 4,
	},
});
