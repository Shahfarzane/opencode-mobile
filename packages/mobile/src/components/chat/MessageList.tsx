import { FlashList, type FlashListRef } from "@shopify/flash-list";
import { useCallback, useRef } from "react";
import { Text, View, useColorScheme } from "react-native";
import { ChatMessage } from "./ChatMessage";
import type { Message } from "./types";
import { OpenChamberLogo } from "../ui/OpenChamberLogo";
import { TextLoop } from "../ui/TextLoop";

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
	const colorScheme = useColorScheme();
	const isDark = colorScheme === 'dark';
	
	const textColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';

	return (
		<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 24 }}>
			<OpenChamberLogo width={140} height={140} opacity={0.2} isAnimated />
			<TextLoop
				interval={4}
				style={{ minHeight: 24 }}
				textStyle={{
					fontFamily: 'IBMPlexMono-Regular',
					fontSize: 14,
					color: textColor,
					textAlign: 'center',
				}}
			>
				{phrases.map((phrase) => (
					<Text key={phrase} style={{ fontFamily: 'IBMPlexMono-Regular', fontSize: 14, color: textColor }}>
						"{phrase}..."
					</Text>
				))}
			</TextLoop>
		</View>
	);
}

function LoadingIndicator() {
	const colorScheme = useColorScheme();
	const isDark = colorScheme === 'dark';

	const colors = {
		card: isDark ? "#282726" : "#F2F0E5",
		mutedForeground: isDark ? "#878580" : "#6F6E69",
	};

	return (
		<View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
			<View style={{ maxWidth: '85%', borderRadius: 12, backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 12 }}>
				<Text style={{ fontFamily: 'IBMPlexMono-Regular', color: colors.mutedForeground }}>Thinking...</Text>
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
