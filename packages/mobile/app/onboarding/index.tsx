import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
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

function ConnectionMethodCard({
	icon,
	title,
	description,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
}) {
	return (
		<View className="flex-row items-start gap-3 rounded-lg border border-border bg-muted/50 p-3">
			<View className="mt-0.5">{icon}</View>
			<View className="flex-1">
				<Text className="font-mono text-sm font-medium text-foreground">
					{title}
				</Text>
				<Text className="mt-1 font-mono text-xs text-muted-foreground">
					{description}
				</Text>
			</View>
		</View>
	);
}

export default function OnboardingIndex() {
	const insets = useSafeAreaInsets();

	return (
		<View
			className="flex-1 bg-background"
			style={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }}
		>
			<ScrollView
				className="flex-1 px-6"
				contentContainerStyle={{ flexGrow: 1 }}
				showsVerticalScrollIndicator={false}
			>
				<View className="flex-1 items-center justify-center py-8">
					<OpenChamberLogo size={80} />

					<Text className="mt-6 font-mono text-2xl font-semibold text-foreground">
						OpenChamber
					</Text>

					<Text className="mt-3 text-center font-mono text-sm text-muted-foreground">
						Connect to your OpenCode server to start coding with AI assistance
					</Text>
				</View>

				<View className="mb-6 gap-2">
					<Text className="mb-1 font-mono text-xs font-medium uppercase text-muted-foreground">
						Supported Connection Methods
					</Text>
					<ConnectionMethodCard
						icon={
							<Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
								<Path
									d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"
									stroke="#878580"
									strokeWidth={2}
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</Svg>
						}
						title="Local Network"
						description="Same WiFi network as your computer"
					/>
					<ConnectionMethodCard
						icon={
							<Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
								<Path
									d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
									stroke="#878580"
									strokeWidth={2}
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</Svg>
						}
						title="Tailscale"
						description="Secure mesh VPN - connect from anywhere"
					/>
					<ConnectionMethodCard
						icon={
							<Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
								<Path
									d="M22 12h-4l-3 9L9 3l-3 9H2"
									stroke="#878580"
									strokeWidth={2}
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</Svg>
						}
						title="Cloudflare Tunnel"
						description="Public tunnel for remote access"
					/>
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

					<Text className="mt-2 text-center font-mono text-xs text-muted-foreground">
						Make sure OpenCode is running on your computer
					</Text>
				</View>
			</ScrollView>
		</View>
	);
}
