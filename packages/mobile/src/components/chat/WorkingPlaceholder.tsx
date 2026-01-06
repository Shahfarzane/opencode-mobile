import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, Animated, StyleSheet, Easing, Text } from "react-native";
import { useTheme } from "../../theme";

// State machine timing constants
const STATUS_DISPLAY_TIME = 1500; // Minimum time to show a status
const DONE_DISPLAY_TIME = 2000; // Time to show "Done" before hiding

type DisplayState = "idle" | "showing" | "done" | "aborted";

interface WorkingPlaceholderProps {
	isStreaming: boolean;
	statusText: string;
	activityType?: "text" | "tool" | "reasoning" | "editing" | null;
}

export function WorkingPlaceholder({
	isStreaming,
	statusText,
	activityType,
}: WorkingPlaceholderProps) {
	const { colors } = useTheme();
	const [displayState, setDisplayState] = useState<DisplayState>("idle");
	const [displayedStatus, setDisplayedStatus] = useState("");
	const shimmerAnim = useRef(new Animated.Value(0)).current;
	const statusStartTimeRef = useRef<number>(0);
	const pendingStatusRef = useRef<string | null>(null);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Shimmer animation loop
	useEffect(() => {
		if (displayState === "showing") {
			const animation = Animated.loop(
				Animated.sequence([
					Animated.timing(shimmerAnim, {
						toValue: 1,
						duration: 1500,
						easing: Easing.inOut(Easing.ease),
						useNativeDriver: true,
					}),
					Animated.timing(shimmerAnim, {
						toValue: 0,
						duration: 1500,
						easing: Easing.inOut(Easing.ease),
						useNativeDriver: true,
					}),
				]),
			);
			animation.start();
			return () => animation.stop();
		} else {
			shimmerAnim.setValue(0);
		}
	}, [displayState, shimmerAnim]);

	const clearPendingTimeout = useCallback(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
	}, []);

	// Handle status text changes with debouncing to prevent flickering
	useEffect(() => {
		if (!isStreaming) {
			// Streaming stopped
			if (displayState === "showing") {
				setDisplayState("done");
				setDisplayedStatus("Done");
				clearPendingTimeout();
				timeoutRef.current = setTimeout(() => {
					setDisplayState("idle");
					setDisplayedStatus("");
				}, DONE_DISPLAY_TIME);
			}
			return;
		}

		if (!statusText) {
			return;
		}

		const now = Date.now();
		const elapsed = now - statusStartTimeRef.current;

		if (displayState === "idle") {
			// First status - show immediately
			setDisplayState("showing");
			setDisplayedStatus(statusText);
			statusStartTimeRef.current = now;
		} else if (displayState === "showing") {
			if (statusText !== displayedStatus) {
				if (elapsed >= STATUS_DISPLAY_TIME) {
					// Enough time passed - update immediately
					setDisplayedStatus(statusText);
					statusStartTimeRef.current = now;
					pendingStatusRef.current = null;
				} else {
					// Queue the update
					pendingStatusRef.current = statusText;
					clearPendingTimeout();
					timeoutRef.current = setTimeout(() => {
						if (pendingStatusRef.current) {
							setDisplayedStatus(pendingStatusRef.current);
							statusStartTimeRef.current = Date.now();
							pendingStatusRef.current = null;
						}
					}, STATUS_DISPLAY_TIME - elapsed);
				}
			}
		} else if (displayState === "done" || displayState === "aborted") {
			// Restart if we were done but streaming resumed
			clearPendingTimeout();
			setDisplayState("showing");
			setDisplayedStatus(statusText);
			statusStartTimeRef.current = now;
		}
	}, [
		isStreaming,
		statusText,
		displayState,
		displayedStatus,
		clearPendingTimeout,
	]);

	// Cleanup on unmount
	useEffect(() => {
		return () => clearPendingTimeout();
	}, [clearPendingTimeout]);

	if (displayState === "idle" || !displayedStatus) {
		return null;
	}

	const opacity = shimmerAnim.interpolate({
		inputRange: [0, 0.5, 1],
		outputRange: [0.6, 1, 0.6],
	});

	// Get activity indicator color
	const getActivityColor = () => {
		if (displayState === "done") return colors.mutedForeground;
		switch (activityType) {
			case "tool":
				return colors.primary;
			case "editing":
				return colors.warning || colors.primary;
			case "reasoning":
				return colors.info || colors.primary;
			default:
				return colors.mutedForeground;
		}
	};

	return (
		<View style={styles.container}>
			<View style={[styles.indicator, { backgroundColor: getActivityColor() }]}>
				{displayState === "showing" && (
					<Animated.View
						style={[
							styles.pulse,
							{
								backgroundColor: getActivityColor(),
								opacity: shimmerAnim.interpolate({
									inputRange: [0, 1],
									outputRange: [0.3, 0],
								}),
								transform: [
									{
										scale: shimmerAnim.interpolate({
											inputRange: [0, 1],
											outputRange: [1, 2],
										}),
									},
								],
							},
						]}
					/>
				)}
			</View>
			<Animated.View style={{ opacity: displayState === "showing" ? opacity : 1 }}>
				<Text
					style={[
						styles.text,
						{
							color:
								displayState === "done" ? colors.mutedForeground : colors.foreground,
						},
					]}
				>
					{displayedStatus}
				</Text>
			</Animated.View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 8,
		gap: 8,
	},
	indicator: {
		width: 8,
		height: 8,
		borderRadius: 4,
		position: "relative",
	},
	pulse: {
		position: "absolute",
		top: 0,
		left: 0,
		width: 8,
		height: 8,
		borderRadius: 4,
	},
	text: {
		fontSize: 14,
		fontWeight: "500",
	},
});
