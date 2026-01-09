import { useMemo } from "react";
import { type StyleProp, Text, type TextStyle } from "react-native";
import { stripAnsiCodes } from "./utils";

interface AnsiTextProps {
	text: string;
	style?: StyleProp<TextStyle>;
	baseColor?: string;
}

export function AnsiText({
	text,
	style,
	baseColor = "#CECDC3",
}: AnsiTextProps) {
	const segments = useMemo(() => {
		// For now, let's strip ANSI codes for cleaner display
		// The full parsing can cause performance issues with large outputs
		const cleaned = stripAnsiCodes(text);
		return [{ text: cleaned, style: { color: baseColor } as TextStyle }];
	}, [text, baseColor]);

	if (segments.length === 0) {
		return null;
	}

	if (segments.length === 1) {
		return (
			<Text style={[style, segments[0].style]} selectable>
				{segments[0].text}
			</Text>
		);
	}

	return (
		<Text style={style} selectable>
			{segments.map((segment, index) => (
				<Text key={`${segment.text}-${index}`} style={segment.style}>
					{segment.text}
				</Text>
			))}
		</Text>
	);
}
