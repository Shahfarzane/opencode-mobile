import { Stack } from "expo-router";
import { useTheme } from "@/theme";

export default function SettingsLayout() {
	const { colors } = useTheme();

	return (
		<Stack
			screenOptions={{
				headerShown: false,
				animation: "slide_from_right",
				contentStyle: {
					backgroundColor: colors.background,
				},
			}}
		>
			<Stack.Screen name="index" />
			<Stack.Screen name="connection" />
			<Stack.Screen name="appearance" />
			<Stack.Screen name="preferences" />
			<Stack.Screen name="about" />
			<Stack.Screen name="agents" />
			<Stack.Screen name="commands" />
			<Stack.Screen name="providers" />
			<Stack.Screen name="git" />
		</Stack>
	);
}
