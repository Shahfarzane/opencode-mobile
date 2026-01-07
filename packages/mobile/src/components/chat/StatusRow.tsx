import { useEffect, useRef } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { LoaderIcon, StopIcon } from "@/components/icons";
import { typography, useTheme } from "@/theme";
import { statusRowStyles } from "./StatusRow.styles";

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
		<View
			className={statusRowStyles.container({})}
			style={{ backgroundColor: colors.muted }}
		>
			<View className={statusRowStyles.left({})}>
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
					className={statusRowStyles.abortButton({})}
					style={{ backgroundColor: colors.destructive }}
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
