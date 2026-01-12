import type BottomSheet from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { Sheet } from "@/components/ui/sheet";
import { Fonts, fontStyle, typography, useTheme } from "@/theme";
import { contextUsageDisplayStyles } from "./ContextUsageDisplay.styles";

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
			<Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} strokeOpacity={0.3} />
			<Path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth={2} strokeLinecap="round" />
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

export function ContextUsageDisplay({ usage, size = "default" }: ContextUsageDisplayProps) {
	const { colors } = useTheme();
	const sheetRef = useRef<BottomSheet>(null);
	const snapPoints = useMemo(() => ["42%"], []);
	const [modalVisible, setModalVisible] = useState(false);
	const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const getPercentageColor = (pct: number): string => {
		if (pct >= 90) return colors.destructive;
		if (pct >= 75) return colors.warning;
		return colors.success;
	};

	useEffect(() => {
		if (modalVisible) {
			sheetRef.current?.snapToIndex(0);
		} else {
			sheetRef.current?.close();
		}
	}, [modalVisible]);

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
	const safeOutputLimit = typeof usage.outputLimit === "number" ? Math.max(usage.outputLimit, 0) : 0;

	return (
		<>
			<Pressable
				onPressIn={handleLongPressStart}
				onPressOut={handleLongPressEnd}
				onPress={() => setModalVisible(true)}
				className={contextUsageDisplayStyles.container({})}
			>
				<DonutChartIcon color={colors.mutedForeground} size={size === "compact" ? 14 : 16} />
				<Text
					style={[
						size === "compact" ? typography.micro : typography.meta,
						fontStyle("500"),
						{ color: percentageColor },
					]}
				>
					{Math.min(usage.percentage, 999).toFixed(1)}%
				</Text>
			</Pressable>

			<Sheet ref={sheetRef} snapPoints={snapPoints} onClose={() => setModalVisible(false)} contentPadding={0}>
				<View className="pb-2">
					<View className="px-4 pt-2 pb-1">
						<Text style={[typography.uiHeader, { color: colors.foreground }]}>Context usage</Text>
					</View>
					<View className="border-t" style={{ borderTopColor: colors.border }} />
					<View className={contextUsageDisplayStyles.modalContent({})}>
						<Text
							className={contextUsageDisplayStyles.modalTitle({})}
							style={[typography.uiLabel, { fontFamily: Fonts.semiBold, color: colors.foreground }]}
						>
							Context Usage
						</Text>

						<View
							className={contextUsageDisplayStyles.statsContainer({})}
							style={{ backgroundColor: colors.muted, borderColor: colors.border, borderWidth: 1 }}
						>
							<View className={contextUsageDisplayStyles.statRow({})}>
								<Text style={[typography.meta, { color: colors.mutedForeground }]}>Used tokens</Text>
								<Text style={[typography.meta, fontStyle("500"), { color: colors.foreground }]}>
									{formatTokens(usage.totalTokens)}
								</Text>
							</View>

							<View className={contextUsageDisplayStyles.statRow({})}>
								<Text style={[typography.meta, { color: colors.mutedForeground }]}>Context limit</Text>
								<Text style={[typography.meta, fontStyle("500"), { color: colors.foreground }]}>
									{formatTokens(usage.contextLimit)}
								</Text>
							</View>

							<View className={contextUsageDisplayStyles.statRow({})}>
								<Text style={[typography.meta, { color: colors.mutedForeground }]}>Output limit</Text>
								<Text style={[typography.meta, fontStyle("500"), { color: colors.foreground }]}>
									{formatTokens(safeOutputLimit)}
								</Text>
							</View>

							<View
								className={contextUsageDisplayStyles.statRowLast({})}
								style={{ borderTopColor: colors.border, borderTopWidth: 1 }}
							>
								<Text style={[typography.meta, { color: colors.mutedForeground }]}>Usage</Text>
								<Text
									style={[
										typography.meta,
										fontStyle("600"),
										{ color: percentageColor },
									]}
								>
									{Math.min(usage.percentage, 999).toFixed(1)}%
								</Text>
							</View>
						</View>
					</View>
				</View>
			</Sheet>
		</>
	);
}
