import { Stack } from "expo-router";

export default function OnboardingLayout() {
	return (
		<Stack
			screenOptions={{
				headerShown: false,
				animation: "slide_from_right",
			}}
		>
			<Stack.Screen name="index" />
			<Stack.Screen name="scan" />
			<Stack.Screen name="manual" />
			<Stack.Screen name="directory" />
		</Stack>
	);
}
