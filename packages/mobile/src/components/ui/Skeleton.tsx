import { useEffect, useRef } from "react";
import {
	Animated,
	type DimensionValue,
	View,
	type ViewStyle,
} from "react-native";
import { shimmer as shimmerAnimation } from "@/lib/animations";
import { useTheme } from "@/theme";

interface SkeletonProps {
	width?: DimensionValue;
	height?: DimensionValue;
	borderRadius?: number;
	variant?: "rectangle" | "circle" | "text";
	style?: ViewStyle;
}

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
			className="overflow-hidden"
			style={[
				{ backgroundColor: colors.muted },
				getVariantStyle(),
				{ opacity: animatedValue },
				style,
			]}
		/>
	);
}

export function SkeletonAvatar({ size = 40 }: { size?: number }) {
	return <Skeleton variant="circle" width={size} height={size} />;
}

export function SkeletonText({
	width = "100%",
	lines = 1,
}: {
	width?: DimensionValue;
	lines?: number;
}) {
	if (lines === 1) {
		return <Skeleton variant="text" width={width} />;
	}

	return (
		<View className="gap-2">
			{Array.from({ length: lines }).map((_, index, arr) => (
				<Skeleton
					key={`skeleton-${arr.length}-${index}`}
					variant="text"
					width={index === lines - 1 ? "60%" : width}
				/>
			))}
		</View>
	);
}

export function SkeletonCard() {
	const { colors } = useTheme();

	return (
		<View
			className="p-4 rounded-xl border gap-3"
			style={{
				backgroundColor: colors.card,
				borderColor: colors.border,
			}}
		>
			<View className="flex-row items-center gap-3">
				<SkeletonAvatar size={32} />
				<View className="flex-1 gap-1">
					<Skeleton variant="text" width={120} height={14} />
					<Skeleton variant="text" width={80} height={12} />
				</View>
			</View>
			<SkeletonText lines={3} />
		</View>
	);
}

export function SkeletonMessage({ isUser = false }: { isUser?: boolean }) {
	const { colors } = useTheme();

	return (
		<View className={`px-4 py-1 ${isUser ? "items-end" : "items-start"}`}>
			<View
				className="p-3 rounded-xl min-w-[100px]"
				style={{
					backgroundColor: isUser
						? colors.chatUserMessageBackground
						: colors.muted,
					alignSelf: isUser ? "flex-end" : "flex-start",
					maxWidth: isUser ? "85%" : "90%",
				}}
			>
				<SkeletonText lines={2} />
			</View>
		</View>
	);
}
