import BottomSheet, {
	BottomSheetBackdrop,
	type BottomSheetBackdropProps,
	BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import { forwardRef, useCallback, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { typography, useTheme } from "@/theme";
import type { Message } from "./types";

interface TimelineTurn {
	turnNumber: number;
	userMessage: Message;
	assistantMessages: Message[];
	timestamp?: number;
}

interface TimelineSheetProps {
	messages: Message[];
	onNavigate: (messageId: string) => void;
	onFork: (messageId: string) => void;
	onClose: () => void;
}

function ClockIcon({ color, size = 16 }: { color: string; size?: number }) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Path
				d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
			/>
			<Path
				d="M12 6v6l4 2"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

function GitBranchIcon({ color, size = 14 }: { color: string; size?: number }) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Path
				d="M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
			/>
			<Path
				d="M18 9c0 6-12 6-12 9"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
			/>
		</Svg>
	);
}

function ArrowRightIcon({
	color,
	size = 14,
}: {
	color: string;
	size?: number;
}) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Path
				d="M5 12h14M12 5l7 7-7 7"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

function TimelineTurnItem({
	turn,
	isLast,
	onNavigate,
	onFork,
}: {
	turn: TimelineTurn;
	isLast: boolean;
	onNavigate: (messageId: string) => void;
	onFork: (messageId: string) => void;
}) {
	const { colors, isDark } = useTheme();

	const handleNavigate = useCallback(() => {
		Haptics.selectionAsync();
		onNavigate(turn.userMessage.id);
	}, [onNavigate, turn.userMessage.id]);

	const handleFork = useCallback(() => {
		Haptics.selectionAsync();
		onFork(turn.userMessage.id);
	}, [onFork, turn.userMessage.id]);

	const userMessagePreview = useMemo(() => {
		const content = turn.userMessage.content || "";
		return content.length > 60 ? `${content.slice(0, 57)}...` : content;
	}, [turn.userMessage.content]);

	const assistantPreview = useMemo(() => {
		if (turn.assistantMessages.length === 0) return null;
		const lastAssistant =
			turn.assistantMessages[turn.assistantMessages.length - 1];
		const content = lastAssistant.content || "";
		return content.length > 50 ? `${content.slice(0, 47)}...` : content;
	}, [turn.assistantMessages]);

	const formatTime = (timestamp?: number) => {
		if (!timestamp) return "";
		const date = new Date(timestamp);
		return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
	};

	return (
		<View style={styles.turnItem}>
			{/* Turn indicator */}
			<View style={styles.turnIndicator}>
				<View
					style={[
						styles.turnDot,
						{
							backgroundColor: colors.primary,
							borderColor: isDark ? colors.background : colors.card,
						},
					]}
				>
					<Text style={[styles.turnNumber, { color: colors.background }]}>
						{turn.turnNumber}
					</Text>
				</View>
				{!isLast && (
					<View style={[styles.turnLine, { backgroundColor: colors.border }]} />
				)}
			</View>

			{/* Turn content */}
			<View style={styles.turnContent}>
				<View
					style={[
						styles.turnCard,
						{ backgroundColor: colors.card, borderColor: colors.border },
					]}
				>
					{/* User message */}
					<View style={styles.turnHeader}>
						<Text
							style={[
								typography.uiLabel,
								{ color: colors.foreground, fontWeight: "600" },
							]}
						>
							You
						</Text>
						{turn.timestamp && (
							<Text
								style={[typography.micro, { color: colors.mutedForeground }]}
							>
								{formatTime(turn.timestamp)}
							</Text>
						)}
					</View>
					<Text
						style={[
							typography.body,
							styles.messagePreview,
							{ color: colors.foreground },
						]}
						numberOfLines={2}
					>
						{userMessagePreview}
					</Text>

					{/* Assistant response preview */}
					{assistantPreview && (
						<View
							style={[
								styles.assistantPreview,
								{ backgroundColor: `${colors.muted}80` },
							]}
						>
							<Text
								style={[typography.micro, { color: colors.mutedForeground }]}
								numberOfLines={1}
							>
								{assistantPreview}
							</Text>
						</View>
					)}

					{/* Action buttons */}
					<View style={styles.turnActions}>
						<Pressable
							onPress={handleNavigate}
							style={({ pressed }) => [
								styles.actionButton,
								{
									backgroundColor: `${colors.primary}15`,
									opacity: pressed ? 0.7 : 1,
								},
							]}
						>
							<ArrowRightIcon color={colors.primary} size={12} />
							<Text style={[typography.micro, { color: colors.primary }]}>
								Go to
							</Text>
						</Pressable>
						<Pressable
							onPress={handleFork}
							style={({ pressed }) => [
								styles.actionButton,
								{
									backgroundColor: `${colors.info}15`,
									opacity: pressed ? 0.7 : 1,
								},
							]}
						>
							<GitBranchIcon color={colors.info} size={12} />
							<Text style={[typography.micro, { color: colors.info }]}>
								Fork
							</Text>
						</Pressable>
					</View>
				</View>
			</View>
		</View>
	);
}

export const TimelineSheet = forwardRef<BottomSheet, TimelineSheetProps>(
	function TimelineSheet({ messages, onNavigate, onFork, onClose }, ref) {
		const { colors } = useTheme();
		const insets = useSafeAreaInsets();
		const snapPoints = useMemo(() => ["50%", "85%"], []);

		// Group messages into turns (user message + following assistant messages)
		const turns = useMemo<TimelineTurn[]>(() => {
			const result: TimelineTurn[] = [];
			let currentTurn: TimelineTurn | null = null;
			let turnNumber = 0;

			for (const message of messages) {
				if (message.role === "user") {
					// Start a new turn
					turnNumber++;
					currentTurn = {
						turnNumber,
						userMessage: message,
						assistantMessages: [],
						timestamp: message.createdAt,
					};
					result.push(currentTurn);
				} else if (currentTurn && message.role === "assistant") {
					// Add to current turn
					currentTurn.assistantMessages.push(message);
				}
			}

			return result;
		}, [messages]);

		const renderBackdrop = useCallback(
			(props: BottomSheetBackdropProps) => (
				<BottomSheetBackdrop
					{...props}
					disappearsOnIndex={-1}
					appearsOnIndex={0}
					opacity={0.4}
				/>
			),
			[],
		);

		const handleSheetChange = useCallback(
			(index: number) => {
				if (index === -1) {
					onClose();
				}
			},
			[onClose],
		);

		return (
			<BottomSheet
				ref={ref}
				index={-1}
				snapPoints={snapPoints}
				enablePanDownToClose
				backdropComponent={renderBackdrop}
				onChange={handleSheetChange}
				backgroundStyle={{ backgroundColor: colors.background }}
				handleIndicatorStyle={{ backgroundColor: colors.mutedForeground }}
			>
				<View style={[styles.header, { borderBottomColor: colors.border }]}>
					<View style={styles.headerTitle}>
						<ClockIcon color={colors.foreground} size={18} />
						<Text style={[typography.uiHeader, { color: colors.foreground }]}>
							Timeline
						</Text>
					</View>
					<Text style={[typography.micro, { color: colors.mutedForeground }]}>
						{turns.length} turn{turns.length !== 1 ? "s" : ""}
					</Text>
				</View>

				<BottomSheetScrollView
					contentContainerStyle={[
						styles.scrollContent,
						{ paddingBottom: insets.bottom + 16 },
					]}
				>
					{turns.length === 0 ? (
						<View style={styles.emptyState}>
							<Text
								style={[typography.body, { color: colors.mutedForeground }]}
							>
								No messages yet
							</Text>
						</View>
					) : (
						turns.map((turn, index) => (
							<TimelineTurnItem
								key={turn.userMessage.id}
								turn={turn}
								isLast={index === turns.length - 1}
								onNavigate={onNavigate}
								onFork={onFork}
							/>
						))
					)}
				</BottomSheetScrollView>
			</BottomSheet>
		);
	},
);

const styles = StyleSheet.create({
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 20,
		paddingVertical: 12,
		borderBottomWidth: 1,
	},
	headerTitle: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	scrollContent: {
		padding: 16,
	},
	emptyState: {
		alignItems: "center",
		paddingVertical: 40,
	},
	turnItem: {
		flexDirection: "row",
		marginBottom: 8,
	},
	turnIndicator: {
		width: 32,
		alignItems: "center",
	},
	turnDot: {
		width: 24,
		height: 24,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 2,
	},
	turnNumber: {
		fontSize: 10,
		fontWeight: "700",
	},
	turnLine: {
		width: 2,
		flex: 1,
		marginTop: 4,
	},
	turnContent: {
		flex: 1,
		paddingLeft: 8,
	},
	turnCard: {
		borderRadius: 10,
		borderWidth: 1,
		padding: 12,
	},
	turnHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 6,
	},
	messagePreview: {
		lineHeight: 20,
	},
	assistantPreview: {
		marginTop: 8,
		padding: 8,
		borderRadius: 6,
	},
	turnActions: {
		flexDirection: "row",
		gap: 8,
		marginTop: 10,
	},
	actionButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 6,
	},
});
