import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import { Fonts, fontStyle, typography, useTheme } from "@/theme";
import { withOpacity } from "@/utils/colors";
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
	const { colors, isDark } = useTheme();
	const insets = useSafeAreaInsets();
	const [modalVisible, setModalVisible] = useState(false);
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const getPercentageColor = (pct: number): string => {
		if (pct >= 90) return colors.destructive;
		if (pct >= 75) return colors.warning;
		return colors.success;
	};

	useEffect(() => {
		if (modalVisible) {
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 150,
				useNativeDriver: true,
			}).start();
		}
	}, [modalVisible, fadeAnim]);

	const handleClose = useCallback(() => {
		Animated.timing(fadeAnim, {
			toValue: 0,
			duration: 100,
			useNativeDriver: true,
		}).start(() => {
			setModalVisible(false);
		});
	}, [fadeAnim]);

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

			<Modal
				visible={modalVisible}
				transparent
				animationType="none"
				onRequestClose={handleClose}
				statusBarTranslucent
			>
				<Animated.View
					style={{
						flex: 1,
						backgroundColor: withOpacity("#000000", isDark ? 0.5 : 0.3),
						opacity: fadeAnim,
					}}
				>
					<Pressable style={{ flex: 1 }} onPress={handleClose}>
						<View
							style={{
								flex: 1,
								justifyContent: "flex-end",
								paddingBottom: insets.bottom + 20,
								paddingHorizontal: 16,
							}}
						>
							<Pressable onPress={(e) => e.stopPropagation()}>
								<Animated.View
									style={{
										backgroundColor: colors.card,
										borderRadius: 16,
										borderWidth: 1,
										borderColor: colors.border,
										overflow: "hidden",
										transform: [
											{
												translateY: fadeAnim.interpolate({
													inputRange: [0, 1],
													outputRange: [20, 0],
												}),
											},
										],
									}}
								>
									<View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
										<Text style={[typography.uiHeader, { color: colors.foreground }]}>
											Context usage
										</Text>
									</View>

									<View style={{ height: 1, backgroundColor: colors.border }} />

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
								</Animated.View>
							</Pressable>
						</View>
					</Pressable>
				</Animated.View>
			</Modal>
		</>
	);
}
