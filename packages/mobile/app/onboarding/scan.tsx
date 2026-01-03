import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useServerConnection } from "@/hooks/useServerConnection";

export default function ScanScreen() {
	const insets = useSafeAreaInsets();
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
				Alert.alert(
					"Invalid QR Code",
					"Please scan a valid OpenChamber pairing QR code",
				);
				setScanned(false);
				return;
			}

			await pairWithQRCode(data);
			router.replace("/(tabs)/chat");
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
			<View className="flex-1 items-center justify-center bg-background">
				<Text className="font-mono text-muted-foreground">
					Loading camera...
				</Text>
			</View>
		);
	}

	if (!permission.granted) {
		return (
			<View
				className="flex-1 items-center justify-center bg-background px-6"
				style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
			>
				<Text className="mb-4 text-center font-mono text-lg text-foreground">
					Camera permission required
				</Text>
				<Text className="mb-6 text-center font-mono text-muted-foreground">
					OpenChamber needs camera access to scan QR codes for pairing
				</Text>
				<Pressable
					onPress={requestPermission}
					className="rounded-lg bg-primary px-6 py-3 active:opacity-80"
				>
					<Text className="font-mono font-semibold text-primary-foreground">
						Grant Permission
					</Text>
				</Pressable>
			</View>
		);
	}

	return (
		<View className="flex-1 bg-background">
			<View
				className="absolute left-0 right-0 z-10 px-6"
				style={{ top: insets.top + 16 }}
			>
				<Pressable
					onPress={() => router.back()}
					className="self-start rounded-lg bg-card/80 px-4 py-2"
				>
					<Text className="font-mono text-foreground">Back</Text>
				</Pressable>
			</View>

			<CameraView
				className="flex-1"
				facing="back"
				barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
				onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
			/>

			<View className="absolute inset-0 items-center justify-center">
				<View className="h-64 w-64 rounded-3xl border-4 border-primary" />
			</View>

			<View
				className="absolute bottom-0 left-0 right-0 bg-background/90 px-6 py-6"
				style={{ paddingBottom: insets.bottom + 20 }}
			>
				<Text className="text-center font-mono text-lg font-medium text-foreground">
					Scan QR Code
				</Text>
				<Text className="mt-2 text-center font-mono text-sm text-muted-foreground">
					Open OpenChamber web interface and go to Settings → Device Pairing
				</Text>
			</View>
		</View>
	);
}
