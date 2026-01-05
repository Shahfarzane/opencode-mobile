import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, type ViewStyle } from "react-native";
import { useTheme } from "@/theme";
import { shimmer as shimmerAnimation } from "@/lib/animations";

interface SkeletonProps {
	width?: number | string;
	height?: number | string;
	borderRadius?: number;
	variant?: "rectangle" | "circle" | "text";
	style?: ViewStyle;
}

/**
 * Skeleton loading component with shimmer animation
 * Matches desktop loading states
 */
export function Skeleton({
	width,
	height,
	borderRadius,
	variant = "rectangle",
	style,
}: SkeletonProps) {
	const { colors } = useTheme();
	const animatedValue = useRef(new Animated.Value(0.3)).current;

	useEffect(() => {
		const animation = shimmerAnimation(animatedValue);
		animation.start();

		return () => {
			animation.stop();
		};
	}, [animatedValue]);

	const getVariantStyle = (): ViewStyle => {
		switch (variant) {
			case "circle":
				return {
					width: width ?? 40,
					height: height ?? 40,
					borderRadius: typeof width === "number" ? width / 2 : 20,
				};
			case "text":
				return {
					width: width ?? "100%",
					height: height ?? 16,
					borderRadius: borderRadius ?? 4,
				};
			case "rectangle":
			default:
				return {
					width: width ?? "100%",
					height: height ?? 20,
					borderRadius: borderRadius ?? 8,
				};
		}
	};

	return (
		<Animated.View
			style={[
				styles.skeleton,
				{ backgroundColor: colors.muted },
				getVariantStyle(),
				{ opacity: animatedValue },
				style,
			]}
		/>
	);
}

/**
 * Pre-composed skeleton for common avatar loading
 */
export function SkeletonAvatar({ size = 40 }: { size?: number }) {
	return <Skeleton variant="circle" width={size} height={size} />;
}

/**
 * Pre-composed skeleton for text line loading
 */
export function SkeletonText({
	width = "100%",
	lines = 1,
}: {
	width?: number | string;
	lines?: number;
}) {
	const { colors } = useTheme();

	if (lines === 1) {
		return <Skeleton variant="text" width={width} />;
	}

	return (
		<View style={styles.textContainer}>
			{Array.from({ length: lines }).map((_, index) => (
				<Skeleton
					key={index}
					variant="text"
					width={index === lines - 1 ? "60%" : width}
				/>
			))}
		</View>
	);
}

/**
 * Pre-composed skeleton for card loading
 */
export function SkeletonCard() {
	const { colors } = useTheme();

	return (
		<View
			style={[
				styles.card,
				{
					backgroundColor: colors.card,
					borderColor: colors.border,
				},
			]}
		>
			<View style={styles.cardHeader}>
				<SkeletonAvatar size={32} />
				<View style={styles.cardHeaderText}>
					<Skeleton variant="text" width={120} height={14} />
					<Skeleton variant="text" width={80} height={12} />
				</View>
			</View>
			<SkeletonText lines={3} />
		</View>
	);
}

/**
 * Pre-composed skeleton for message bubble loading
 */
export function SkeletonMessage({ isUser = false }: { isUser?: boolean }) {
	const { colors } = useTheme();

	return (
		<View
			style={[
				styles.message,
				isUser ? styles.messageUser : styles.messageAssistant,
			]}
		>
			<View
				style={[
					styles.messageBubble,
					{
						backgroundColor: isUser
							? colors.chatUserMessageBackground
							: colors.muted,
						alignSelf: isUser ? "flex-end" : "flex-start",
						maxWidth: isUser ? "85%" : "90%",
					},
				]}
			>
				<SkeletonText lines={2} />
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	skeleton: {
		overflow: "hidden",
	},
	textContainer: {
		gap: 8,
	},
	card: {
		padding: 16,
		borderRadius: 12,
		borderWidth: 1,
		gap: 12,
	},
	cardHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	cardHeaderText: {
		flex: 1,
		gap: 4,
	},
	message: {
		paddingHorizontal: 16,
		paddingVertical: 4,
	},
	messageUser: {
		alignItems: "flex-end",
	},
	messageAssistant: {
		alignItems: "flex-start",
	},
	messageBubble: {
		padding: 12,
		borderRadius: 12,
		minWidth: 100,
	},
});
