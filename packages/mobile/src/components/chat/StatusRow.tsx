import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { LoaderIcon, StopIcon } from "@/components/icons";
import { typography, useTheme } from "@/theme";

interface StatusRowProps {
	isWorking?: boolean;
	statusText?: string;
	onAbort?: () => void;
	canAbort?: boolean;
}

export function StatusRow({
	isWorking = false,
	statusText,
	onAbort,
	canAbort = false,
}: StatusRowProps) {
	const { colors } = useTheme();
	const spinAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		if (isWorking) {
			Animated.loop(
				Animated.timing(spinAnim, {
					toValue: 1,
					duration: 1000,
					useNativeDriver: true,
				}),
			).start();
		} else {
			spinAnim.setValue(0);
		}
	}, [isWorking, spinAnim]);

	if (!isWorking && !statusText) {
		return null;
	}

	const spin = spinAnim.interpolate({
		inputRange: [0, 1],
		outputRange: ["0deg", "360deg"],
	});

	return (
		<View style={[styles.container, { backgroundColor: colors.muted }]}>
			<View style={styles.left}>
				{isWorking && (
					<Animated.View style={{ transform: [{ rotate: spin }] }}>
						<LoaderIcon size={14} color={colors.primary} />
					</Animated.View>
				)}
				<Text
					style={[
						typography.micro,
						{
							color: isWorking ? colors.primary : colors.mutedForeground,
						},
					]}
					numberOfLines={1}
				>
					{statusText || (isWorking ? "Working..." : "")}
				</Text>
			</View>

			{isWorking && canAbort && onAbort && (
				<Pressable
					onPress={onAbort}
					style={[styles.abortButton, { backgroundColor: colors.destructive }]}
					hitSlop={8}
				>
					<StopIcon size={12} color={colors.destructiveForeground} />
					<Text
						style={[typography.micro, { color: colors.destructiveForeground }]}
					>
						Stop
					</Text>
				</Pressable>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 8,
		marginBottom: 8,
	},
	left: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		flex: 1,
	},
	abortButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 6,
	},
});
