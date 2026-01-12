import { Children, useCallback, useEffect, useState } from "react";
import type { TextStyle, ViewStyle } from "react-native";
import { Animated as RNAnimated, Text, View } from "react-native";
import { textLoopStyles } from "./TextLoop.styles";

interface TextLoopProps {
	children: React.ReactNode[];
	interval?: number;
	style?: ViewStyle;
	textStyle?: TextStyle;
}

export function TextLoop({
	children,
	interval = 4,
	style,
	textStyle,
}: TextLoopProps) {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [opacity] = useState(() => new RNAnimated.Value(1));
	const [translateY] = useState(() => new RNAnimated.Value(0));
	const items = Children.toArray(children);

	const nextItem = useCallback(() => {
		setCurrentIndex((prev) => (prev + 1) % items.length);
	}, [items.length]);

	useEffect(() => {
		const intervalMs = interval * 1000;

		const timer = setInterval(() => {
			RNAnimated.parallel([
				RNAnimated.timing(opacity, {
					toValue: 0,
					duration: 500,
					useNativeDriver: true,
				}),
				RNAnimated.timing(translateY, {
					toValue: -20,
					duration: 500,
					useNativeDriver: true,
				}),
			]).start(() => {
				nextItem();
				translateY.setValue(20);
				RNAnimated.parallel([
					RNAnimated.timing(opacity, {
						toValue: 1,
						duration: 500,
						useNativeDriver: true,
					}),
					RNAnimated.timing(translateY, {
						toValue: 0,
						duration: 500,
						useNativeDriver: true,
					}),
				]).start();
			});
		}, intervalMs);

		return () => clearInterval(timer);
	}, [interval, nextItem, opacity, translateY]);

	return (
		<View className={textLoopStyles.container({})} style={style}>
			<RNAnimated.View style={{ opacity, transform: [{ translateY }] }}>
				{typeof items[currentIndex] === "string" ? (
					<Text style={textStyle}>{items[currentIndex]}</Text>
				) : (
					items[currentIndex]
				)}
			</RNAnimated.View>
		</View>
	);
}

export default TextLoop;
