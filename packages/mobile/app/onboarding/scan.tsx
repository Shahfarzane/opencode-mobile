import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useServerConnection } from "@/hooks/useServerConnection";
import { Spacing, typography, useTheme } from "../../src/theme";

function BackButton({ light }: { light?: boolean }) {
	const { colors } = useTheme();
	const color = light ? "#fff" : colors.foreground;

	return (
		<Pressable
			onPress={() => {
				Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
				router.back();
			}}
			style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
			hitSlop={8}
		>
			<Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
				<Path
					d="M15 18l-6-6 6-6"
					stroke={color}
					strokeWidth={2}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</Svg>
			<Text style={[typography.uiLabel, { color }]}>Back</Text>
		</Pressable>
	);
}

function ScannerFrame() {
	const { colors } = useTheme();

	return (
		<View style={styles.frame}>
			<View style={[styles.cornerTL, { borderColor: colors.primary }]} />
			<View style={[styles.cornerTR, { borderColor: colors.primary }]} />
			<View style={[styles.cornerBL, { borderColor: colors.primary }]} />
			<View style={[styles.cornerBR, { borderColor: colors.primary }]} />
		</View>
	);
}

export default function ScanScreen() {
	const insets = useSafeAreaInsets();
	const { colors } = useTheme();
	const [permission, requestPermission] = useCameraPermissions();
	const [scanned, setScanned] = useState(false);
	const { pairWithQRCode, isConnecting } = useServerConnection();

	useEffect(() => {
		if (!permission?.granted) {
			requestPermission();
		}
	}, [permission, requestPermission]);

	async function handleBarCodeScanned({ data }: { data: string }) {
		if (scanned || isConnecting) return;

		setScanned(true);
		await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

		try {
			if (!data.startsWith("openchamber://pair")) {
				Alert.alert("Invalid QR Code", "Please scan a valid OpenChamber pairing QR code");
				setScanned(false);
				return;
			}

			await pairWithQRCode(data);

			// Navigate to directory selection so user can choose their project directory
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
			router.replace("/onboarding/directory");
		} catch (error) {
			Alert.alert(
				"Connection Failed",
				error instanceof Error ? error.message : "Could not connect to server",
			);
			setScanned(false);
		}
	}

	if (!permission) {
		return (
			<View style={[styles.centered, { backgroundColor: colors.background }]}>
				<ActivityIndicator size="small" color={colors.primary} />
			</View>
		);
	}

	if (!permission.granted) {
		return (
			<View style={[styles.container, { backgroundColor: colors.background }]}>
				<View style={{ paddingTop: insets.top + Spacing.md, paddingHorizontal: Spacing.lg }}>
					<BackButton />
				</View>

				<View style={styles.permissionContent}>
					<Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
						<Path
							d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
							stroke={colors.mutedForeground}
							strokeWidth={1.5}
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
						<Path
							d="M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
							stroke={colors.mutedForeground}
							strokeWidth={1.5}
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</Svg>

					<Text style={[typography.h2, { color: colors.foreground, marginTop: 24, textAlign: "center" }]}>
						Camera Access Required
					</Text>
					<Text style={[typography.meta, styles.permissionText, { color: colors.mutedForeground }]}>
						OpenChamber needs camera access to scan QR codes for pairing
					</Text>

					<Pressable
						onPress={() => {
							Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
							requestPermission();
						}}
						style={({ pressed }) => [
							styles.grantBtn,
							{ backgroundColor: colors.primary },
							pressed && { opacity: 0.9 },
						]}
					>
						<Text style={[typography.uiLabel, { color: colors.primaryForeground, fontWeight: "600" }]}>
							Grant Permission
						</Text>
					</Pressable>
				</View>
			</View>
		);
	}

	return (
		<View style={styles.cameraContainer}>
			<View style={[styles.cameraHeader, { top: insets.top + Spacing.md }]}>
				<BackButton light />
			</View>

			<CameraView
				style={styles.camera}
				facing="back"
				barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
				onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
			/>

			<View style={styles.overlay}>
				<ScannerFrame />
			</View>

			<View
				style={[
					styles.bottomPanel,
					{ backgroundColor: colors.background, paddingBottom: insets.bottom + Spacing.lg },
				]}
			>
				<Text style={[typography.uiLabel, { color: colors.foreground, fontWeight: "600", textAlign: "center" }]}>
					Scan QR Code
				</Text>
				<Text style={[typography.meta, { color: colors.mutedForeground, textAlign: "center", marginTop: 8 }]}>
					Open Settings → Device Pairing in the web interface
				</Text>

				{scanned && (
					<Text style={[typography.meta, { color: colors.primary, textAlign: "center", marginTop: 12 }]}>
						{isConnecting ? "Connecting..." : "Processing..."}
					</Text>
				)}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	centered: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	backBtn: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		alignSelf: "flex-start",
		paddingVertical: 8,
		paddingRight: 12,
	},
	permissionContent: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: Spacing.lg,
	},
	permissionText: {
		textAlign: "center",
		marginTop: 12,
		maxWidth: 280,
		lineHeight: 20,
	},
	grantBtn: {
		marginTop: 32,
		borderRadius: 8,
		paddingHorizontal: 24,
		paddingVertical: 14,
	},
	cameraContainer: {
		flex: 1,
		backgroundColor: "#000",
	},
	cameraHeader: {
		position: "absolute",
		left: 0,
		right: 0,
		zIndex: 10,
		paddingHorizontal: Spacing.lg,
	},
	camera: {
		flex: 1,
	},
	overlay: {
		...StyleSheet.absoluteFillObject,
		alignItems: "center",
		justifyContent: "center",
	},
	frame: {
		width: 256,
		height: 256,
	},
	cornerTL: {
		position: "absolute",
		left: 0,
		top: 0,
		width: 40,
		height: 40,
		borderLeftWidth: 3,
		borderTopWidth: 3,
		borderTopLeftRadius: 12,
	},
	cornerTR: {
		position: "absolute",
		right: 0,
		top: 0,
		width: 40,
		height: 40,
		borderRightWidth: 3,
		borderTopWidth: 3,
		borderTopRightRadius: 12,
	},
	cornerBL: {
		position: "absolute",
		left: 0,
		bottom: 0,
		width: 40,
		height: 40,
		borderLeftWidth: 3,
		borderBottomWidth: 3,
		borderBottomLeftRadius: 12,
	},
	cornerBR: {
		position: "absolute",
		right: 0,
		bottom: 0,
		width: 40,
		height: 40,
		borderRightWidth: 3,
		borderBottomWidth: 3,
		borderBottomRightRadius: 12,
	},
	bottomPanel: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		paddingHorizontal: Spacing.lg,
		paddingTop: Spacing.lg,
	},
});
