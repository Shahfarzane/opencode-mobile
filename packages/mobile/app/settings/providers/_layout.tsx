import { Stack } from "expo-router";
import { useTheme } from "@/theme";

export default function ProvidersLayout() {
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
			<Stack.Screen name="add" />
			<Stack.Screen name="[id]" />
		</Stack>
	);
}
