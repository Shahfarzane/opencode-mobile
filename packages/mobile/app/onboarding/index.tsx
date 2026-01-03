import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";

function OpenChamberLogo({ size = 80 }: { size?: number }) {
	return (
		<View
			style={{ width: size, height: size }}
			className="items-center justify-center rounded-2xl bg-primary"
		>
			<Svg
				width={size * 0.6}
				height={size * 0.6}
				viewBox="0 0 24 24"
				fill="none"
			>
				<Circle cx="12" cy="12" r="10" stroke="#FFFCF0" strokeWidth="2" />
				<Path
					d="M8 12h8M12 8v8"
					stroke="#FFFCF0"
					strokeWidth="2"
					strokeLinecap="round"
				/>
			</Svg>
		</View>
	);
}

export default function OnboardingIndex() {
	const insets = useSafeAreaInsets();

	return (
		<View
			className="flex-1 bg-background px-6"
			style={{ paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }}
		>
			<View className="flex-1 items-center justify-center">
				<OpenChamberLogo size={100} />

				<Text className="mt-8 font-mono text-3xl font-semibold text-foreground">
					OpenChamber
				</Text>

				<Text className="mt-4 text-center font-mono text-base text-muted-foreground">
					Connect to your OpenCode server to start coding with AI assistance
				</Text>
			</View>

			<View className="gap-3">
				<Pressable
					onPress={() => router.push("/onboarding/scan")}
					className="flex-row items-center justify-center rounded-lg bg-primary px-6 py-4 active:opacity-80"
				>
					<Text className="font-mono text-base font-semibold text-primary-foreground">
						Scan QR Code to Pair
					</Text>
				</Pressable>

				<Pressable
					onPress={() => router.push("/onboarding/manual")}
					className="flex-row items-center justify-center rounded-lg border border-border bg-muted px-6 py-4 active:opacity-80"
				>
					<Text className="font-mono text-base font-medium text-foreground">
						Enter Server URL Manually
					</Text>
				</Pressable>

				<Text className="mt-4 text-center font-mono text-sm text-muted-foreground">
					Make sure OpenCode is running on your computer
				</Text>
			</View>
		</View>
	);
}
