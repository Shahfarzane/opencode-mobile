import { FlashList, type FlashListRef } from "@shopify/flash-list";
import * as Haptics from "expo-haptics";
import { useCallback, useRef, useState } from "react";
import type {
	NativeScrollEvent,
	NativeSyntheticEvent,
	TextStyle,
} from "react-native";
import { Text, View } from "react-native";
import { ArrowDownIcon } from "@/components/icons";
import { IconButton } from "@/components/ui";
import { getShadowColor, ShadowTokens, typography, useTheme } from "@/theme";
import { withOpacity, OPACITY } from "@/utils/colors";
import { OpenChamberLogo } from "../ui/OpenChamberLogo";
import { TextLoop } from "../ui/TextLoop";
import { ChatMessage } from "./ChatMessage";
import { messageListStyles } from "./MessageList.styles";
import type { Message } from "./types";

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
	const { colors } = useTheme();
	const textColor = withOpacity(colors.foreground, OPACITY.scrim);

	return (
		<View className={messageListStyles.emptyContainer({})}>
			<OpenChamberLogo width={140} height={140} opacity={0.2} isAnimated />
			<TextLoop
				interval={4}
				style={{ minHeight: 28 }}
				textStyle={
					{
						...typography.markdown,
						textAlign: "center",
						color: textColor,
					} as TextStyle
				}
			>
				{phrases.map((phrase) => (
					<Text key={phrase} style={[typography.markdown, { color: textColor, textAlign: "center" }]}>"{phrase}…"</Text>
				))}
			</TextLoop>
		</View>
	);
}

export function MessageList({
	messages,
	isLoading,
	onRevert,
	onFork,
	onSelectSession,
}: MessageListProps) {
	const { colors, isDark } = useTheme();
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
			const { contentOffset, contentSize, layoutMeasurement } =
				event.nativeEvent;
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
		<View className={messageListStyles.container({})}>
			<FlashList
				ref={listRef}
				data={messages}
				renderItem={renderItem}
				keyExtractor={keyExtractor}
				extraData={messages}
				{...({ estimatedItemSize: 120 } as object)}
				contentContainerStyle={{ paddingTop: 12, paddingBottom: 16 }}
				onContentSizeChange={handleContentSizeChange}
				onScroll={handleScroll}
				scrollEventThrottle={16}
				showsVerticalScrollIndicator={false}
			/>
			{/* Scroll-to-bottom button */}
			{showScrollButton && messages.length > 0 && (
				<View
					className={messageListStyles.scrollToBottomButton({})}
					style={{
						backgroundColor: colors.background,
						borderColor: colors.border,
						borderWidth: 1,
						shadowColor: getShadowColor(isDark),
						...ShadowTokens.card,
					}}
				>
					<IconButton
						icon={<ArrowDownIcon color={colors.foreground} size={16} />}
						variant="ghost"
						size="icon-sm"
						onPress={scrollToBottom}
						accessibilityLabel="Scroll to bottom"
					/>
				</View>
			)}
		</View>
	);
}
