import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import { typography, useTheme } from "../../src/theme";

function Logo({ size = 64 }: { size?: number }) {
	const { colors } = useTheme();

	return (
		<View
			style={{
				width: size,
				height: size,
				alignItems: "center",
				justifyContent: "center",
				backgroundColor: colors.primary,
				borderRadius: size / 4,
			}}
		>
			<Svg
				width={size * 0.5}
				height={size * 0.5}
				viewBox="0 0 24 24"
				fill="none"
			>
				<Circle
					cx="12"
					cy="12"
					r="9"
					stroke={colors.primaryForeground}
					strokeWidth="1.5"
				/>
				<Path
					d="M8.5 12h7M12 8.5v7"
					stroke={colors.primaryForeground}
					strokeWidth="1.5"
					strokeLinecap="round"
				/>
			</Svg>
		</View>
	);
}

export default function OnboardingIndex() {
	const insets = useSafeAreaInsets();
	const { colors } = useTheme();

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={{
					flexGrow: 1,
					paddingTop: insets.top + 48,
					paddingBottom: insets.bottom + 32,
					paddingHorizontal: 24,
				}}
				showsVerticalScrollIndicator={false}
			>
				{/* Hero */}
				<View style={styles.hero}>
					<Logo size={64} />
					<Text
						style={[typography.h1, { color: colors.foreground, marginTop: 24 }]}
					>
						OpenChamber
					</Text>
					<Text
						style={[
							typography.meta,
							styles.subtitle,
							{ color: colors.mutedForeground },
						]}
					>
						Connect to your OpenCode server to start coding with AI assistance
					</Text>
				</View>

				{/* Connection info */}
				<View style={[styles.infoCard, { borderColor: colors.border + "66" }]}>
					<Text
						style={[
							typography.uiLabel,
							{ color: colors.foreground, fontWeight: "600" },
						]}
					>
						Supported connections
					</Text>
					<View style={styles.infoList}>
						<Text style={[typography.meta, { color: colors.mutedForeground }]}>
							• Local network (same WiFi)
						</Text>
						<Text style={[typography.meta, { color: colors.mutedForeground }]}>
							• Tailscale mesh VPN
						</Text>
						<Text style={[typography.meta, { color: colors.mutedForeground }]}>
							• Cloudflare Tunnel
						</Text>
					</View>
				</View>

				{/* Actions */}
				<View style={styles.actions}>
					<Pressable
						onPress={() => {
							Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
							router.push("/onboarding/scan");
						}}
						style={({ pressed }) => [
							styles.primaryBtn,
							{ backgroundColor: colors.primary },
							pressed && { opacity: 0.9 },
						]}
					>
						<Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
							<Path
								d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"
								stroke={colors.primaryForeground}
								strokeWidth={2}
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</Svg>
						<Text
							style={[
								typography.uiLabel,
								{ color: colors.primaryForeground, fontWeight: "600" },
							]}
						>
							Scan QR Code
						</Text>
					</Pressable>

					<Pressable
						onPress={() => {
							Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
							router.push("/onboarding/manual");
						}}
						style={({ pressed }) => [
							styles.secondaryBtn,
							{ borderColor: colors.border },
							pressed && { opacity: 0.7 },
						]}
					>
						<Text style={[typography.uiLabel, { color: colors.foreground }]}>
							Enter URL manually
						</Text>
					</Pressable>
				</View>

				{/* Footer */}
				<Text
					style={[
						typography.micro,
						styles.footer,
						{ color: colors.mutedForeground },
					]}
				>
					Make sure OpenCode is running on your computer
				</Text>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollView: {
		flex: 1,
	},
	hero: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingBottom: 48,
	},
	subtitle: {
		marginTop: 12,
		maxWidth: 280,
		textAlign: "center",
		lineHeight: 20,
	},
	infoCard: {
		borderWidth: 1,
		borderRadius: 8,
		padding: 16,
		marginBottom: 32,
	},
	infoList: {
		marginTop: 12,
		gap: 6,
	},
	actions: {
		gap: 12,
	},
	primaryBtn: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		borderRadius: 8,
		paddingVertical: 14,
	},
	secondaryBtn: {
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 8,
		borderWidth: 1,
		paddingVertical: 14,
	},
	footer: {
		marginTop: 24,
		textAlign: "center",
	},
});
