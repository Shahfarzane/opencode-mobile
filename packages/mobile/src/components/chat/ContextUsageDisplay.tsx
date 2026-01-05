import React, { useCallback, useEffect, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { typography, useTheme } from "@/theme";

export interface ContextUsage {
	totalTokens: number;
	percentage: number;
	contextLimit: number;
	outputLimit?: number;
}

interface ContextUsageDisplayProps {
	usage: ContextUsage;
	size?: "default" | "compact";
}

function DonutChartIcon({ color, size }: { color: string; size: number }) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Circle
				cx="12"
				cy="12"
				r="10"
				stroke={color}
				strokeWidth={2}
				strokeOpacity={0.3}
			/>
			<Path
				d="M12 2a10 10 0 0 1 10 10"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
			/>
		</Svg>
	);
}

function formatTokens(tokens: number): string {
	if (tokens >= 1_000_000) {
		return `${(tokens / 1_000_000).toFixed(1)}M`;
	}
	if (tokens >= 1_000) {
		return `${(tokens / 1_000).toFixed(1)}K`;
	}
	return tokens.toFixed(0);
}

export function ContextUsageDisplay({
	usage,
	size = "default",
}: ContextUsageDisplayProps) {
	const { colors } = useTheme();
	const [modalVisible, setModalVisible] = useState(false);
	const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const getPercentageColor = (pct: number): string => {
		if (pct >= 90) return colors.destructive;
		if (pct >= 75) return colors.warning;
		return colors.success;
	};

	const handleLongPressStart = useCallback(() => {
		if (longPressTimerRef.current) {
			clearTimeout(longPressTimerRef.current);
		}
		longPressTimerRef.current = setTimeout(() => {
			setModalVisible(true);
		}, 500);
	}, []);

	const handleLongPressEnd = useCallback(() => {
		if (longPressTimerRef.current) {
			clearTimeout(longPressTimerRef.current);
			longPressTimerRef.current = null;
		}
	}, []);

	useEffect(() => {
		return () => {
			if (longPressTimerRef.current) {
				clearTimeout(longPressTimerRef.current);
			}
		};
	}, []);

	const percentageColor = getPercentageColor(usage.percentage);
	const safeOutputLimit =
		typeof usage.outputLimit === "number" ? Math.max(usage.outputLimit, 0) : 0;

	return (
		<>
			<Pressable
				onPressIn={handleLongPressStart}
				onPressOut={handleLongPressEnd}
				onPress={() => setModalVisible(true)}
				style={styles.container}
			>
				<DonutChartIcon
					color={colors.mutedForeground}
					size={size === "compact" ? 14 : 16}
				/>
				<Text
					style={[
						size === "compact" ? typography.micro : typography.meta,
						{ color: percentageColor, fontWeight: "500" },
					]}
				>
					{Math.min(usage.percentage, 999).toFixed(1)}%
				</Text>
			</Pressable>

			<Modal
				visible={modalVisible}
				transparent
				animationType="fade"
				onRequestClose={() => setModalVisible(false)}
			>
				<Pressable
					style={styles.modalOverlay}
					onPress={() => setModalVisible(false)}
				>
					<View
						style={[
							styles.modalContent,
							{ backgroundColor: colors.card, borderColor: colors.border },
						]}
					>
						<Text
							style={[
								typography.uiLabel,
								styles.modalTitle,
								{ color: colors.foreground },
							]}
						>
							Context Usage
						</Text>

						<View
							style={[
								styles.statsContainer,
								{ backgroundColor: colors.muted, borderColor: colors.border },
							]}
						>
							<View style={styles.statRow}>
								<Text
									style={[typography.meta, { color: colors.mutedForeground }]}
								>
									Used tokens
								</Text>
								<Text
									style={[
										typography.meta,
										{ color: colors.foreground, fontWeight: "500" },
									]}
								>
									{formatTokens(usage.totalTokens)}
								</Text>
							</View>

							<View style={styles.statRow}>
								<Text
									style={[typography.meta, { color: colors.mutedForeground }]}
								>
									Context limit
								</Text>
								<Text
									style={[
										typography.meta,
										{ color: colors.foreground, fontWeight: "500" },
									]}
								>
									{formatTokens(usage.contextLimit)}
								</Text>
							</View>

							<View style={styles.statRow}>
								<Text
									style={[typography.meta, { color: colors.mutedForeground }]}
								>
									Output limit
								</Text>
								<Text
									style={[
										typography.meta,
										{ color: colors.foreground, fontWeight: "500" },
									]}
								>
									{formatTokens(safeOutputLimit)}
								</Text>
							</View>

							<View
								style={[
									styles.statRow,
									styles.statRowLast,
									{ borderTopColor: colors.border },
								]}
							>
								<Text
									style={[typography.meta, { color: colors.mutedForeground }]}
								>
									Usage
								</Text>
								<Text
									style={[
										typography.meta,
										{ color: percentageColor, fontWeight: "600" },
									]}
								>
									{Math.min(usage.percentage, 999).toFixed(1)}%
								</Text>
							</View>
						</View>
					</View>
				</Pressable>
			</Modal>
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.5)",
		justifyContent: "center",
		alignItems: "center",
		padding: 24,
	},
	modalContent: {
		width: "100%",
		maxWidth: 320,
		borderRadius: 16,
		padding: 16,
		borderWidth: 1,
	},
	modalTitle: {
		fontWeight: "600",
		marginBottom: 12,
	},
	statsContainer: {
		borderRadius: 12,
		padding: 12,
		borderWidth: 1,
	},
	statRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 4,
	},
	statRowLast: {
		marginTop: 8,
		paddingTop: 8,
		borderTopWidth: 1,
	},
});
