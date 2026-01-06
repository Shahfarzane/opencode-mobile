import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import * as Haptics from "expo-haptics";
import Svg, { Path } from "react-native-svg";
import { type Provider, providersApi } from "@/api";
import { typography, useTheme } from "@/theme";
import { SettingsSection } from "./SettingsSection";
import { SettingsTextField } from "./shared";

interface ProviderDetailViewProps {
	providerId: string;
	onBack: () => void;
}

export function ProviderDetailView({
	providerId,
	onBack,
}: ProviderDetailViewProps) {
	const { colors } = useTheme();
	const [provider, setProvider] = useState<Provider | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [apiKey, setApiKey] = useState("");
	const [showApiKey, setShowApiKey] = useState(false);

	const loadProvider = useCallback(async () => {
		setIsLoading(true);
		try {
			const providersList = await providersApi.list();
			const foundProvider = providersList.find((p) => p.id === providerId);
			if (foundProvider) {
				setProvider(foundProvider);
			}
		} catch (error) {
			console.error("Failed to load provider:", error);
			Alert.alert("Error", "Failed to load provider details");
		} finally {
			setIsLoading(false);
		}
	}, [providerId]);

	useEffect(() => {
		loadProvider();
	}, [loadProvider]);

	const handleSaveApiKey = async () => {
		if (!apiKey.trim()) {
			Alert.alert("Error", "API key is required");
			return;
		}

		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		setIsSaving(true);
		try {
			const success = await providersApi.setApiKey(providerId, apiKey.trim());
			if (success) {
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
				Alert.alert("Success", "API key saved");
				setApiKey("");
			} else {
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
				Alert.alert("Error", "Failed to save API key");
			}
		} catch (error) {
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
			Alert.alert(
				"Error",
				error instanceof Error ? error.message : "Failed to save API key",
			);
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color={colors.primary} />
			</View>
		);
	}

	if (!provider) {
		return (
			<View style={styles.container}>
				<View style={[styles.header, { borderBottomColor: colors.border }]}>
					<Pressable onPress={onBack} style={styles.backButton}>
						<Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
							<Path
								d="M15 18l-6-6 6-6"
								stroke={colors.foreground}
								strokeWidth={2}
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</Svg>
					</Pressable>
					<Text style={[typography.uiLabel, styles.headerTitle, { color: colors.foreground }]}>
						Provider
					</Text>
				</View>
				<View style={styles.emptyContainer}>
					<Text style={[typography.uiLabel, { color: colors.mutedForeground }]}>
						Provider not found
					</Text>
				</View>
			</View>
		);
	}

	const modelCount = provider.models?.length ?? 0;

	return (
		<View style={styles.container}>
			<View style={[styles.header, { borderBottomColor: colors.border }]}>
				<Pressable onPress={onBack} style={styles.backButton}>
					<Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
						<Path
							d="M15 18l-6-6 6-6"
							stroke={colors.foreground}
							strokeWidth={2}
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</Svg>
				</Pressable>
				<Text style={[typography.uiLabel, styles.headerTitle, { color: colors.foreground }]}>
					{provider.name || provider.id}
				</Text>
			</View>

			<ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
				<SettingsSection title="Provider Information" showDivider={false}>
					<View style={[styles.infoCard, { backgroundColor: colors.muted }]}>
						<View style={styles.infoRow}>
							<Text style={[typography.meta, { color: colors.mutedForeground }]}>
								ID
							</Text>
							<Text style={[typography.uiLabel, { color: colors.foreground }]}>
								{provider.id}
							</Text>
						</View>
						<View style={[styles.infoRow, styles.infoDivider, { borderTopColor: colors.border }]}>
							<Text style={[typography.meta, { color: colors.mutedForeground }]}>
								Name
							</Text>
							<Text style={[typography.uiLabel, { color: colors.foreground }]}>
								{provider.name || provider.id}
							</Text>
						</View>
						<View style={[styles.infoRow, styles.infoDivider, { borderTopColor: colors.border }]}>
							<Text style={[typography.meta, { color: colors.mutedForeground }]}>
								Status
							</Text>
							<View style={[styles.statusBadge, { backgroundColor: provider.enabled ? colors.primary + "20" : colors.muted }]}>
								<Text style={[typography.micro, { color: provider.enabled ? colors.primary : colors.mutedForeground }]}>
									{provider.enabled ? "Enabled" : "Disabled"}
								</Text>
							</View>
						</View>
						<View style={[styles.infoRow, styles.infoDivider, { borderTopColor: colors.border }]}>
							<Text style={[typography.meta, { color: colors.mutedForeground }]}>
								Available Models
							</Text>
							<Text style={[typography.uiLabel, { color: colors.foreground }]}>
								{modelCount}
							</Text>
						</View>
					</View>
				</SettingsSection>

				<SettingsSection title="API Key">
					<Text style={[typography.meta, { color: colors.mutedForeground, marginBottom: 12 }]}>
						API keys are stored securely on the server, not on this device.
					</Text>
					<View style={styles.formGroup}>
						<SettingsTextField
							label="New API Key"
							value={apiKey}
							onChangeText={setApiKey}
							placeholder="Enter API key..."
							secureTextEntry={!showApiKey}
							autoCapitalize="none"
							autoCorrect={false}
						/>
					</View>
					<Pressable
						onPress={() => setShowApiKey(!showApiKey)}
						style={styles.toggleButton}
					>
						<Text style={[typography.meta, { color: colors.primary }]}>
							{showApiKey ? "Hide" : "Show"} API Key
						</Text>
					</Pressable>
					<Pressable
						onPress={handleSaveApiKey}
						disabled={isSaving || !apiKey.trim()}
						style={[
							styles.saveButton,
							{
								backgroundColor: apiKey.trim() ? colors.primary : colors.muted,
								opacity: isSaving ? 0.6 : 1,
							},
						]}
					>
						{isSaving ? (
							<ActivityIndicator size="small" color={colors.background} />
						) : (
							<Text style={[typography.uiLabel, { color: apiKey.trim() ? colors.background : colors.mutedForeground }]}>
								Save API Key
							</Text>
						)}
					</Pressable>
				</SettingsSection>

				{modelCount > 0 && (
					<SettingsSection title="Available Models">
						<View style={[styles.modelsList, { backgroundColor: colors.muted }]}>
							{provider.models?.map((model, index) => (
								<View
									key={model.id}
									style={[
										styles.modelItem,
										index > 0 && styles.modelDivider,
										index > 0 && { borderTopColor: colors.border },
									]}
								>
									<Text style={[typography.uiLabel, { color: colors.foreground }]}>
										{model.name || model.id}
									</Text>
									{model.contextLength && (
										<Text style={[typography.micro, { color: colors.mutedForeground }]}>
											Context: {model.contextLength.toLocaleString()} tokens
										</Text>
									)}
								</View>
							))}
						</View>
					</SettingsSection>
				)}

				<View style={styles.bottomSpacer} />
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	loadingContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	emptyContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		borderBottomWidth: 1,
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	backButton: {
		padding: 4,
		marginRight: 12,
		marginLeft: -4,
	},
	headerTitle: {
		flex: 1,
		fontWeight: "600",
	},
	scrollView: {
		flex: 1,
	},
	content: {
		padding: 16,
	},
	infoCard: {
		borderRadius: 8,
		overflow: "hidden",
	},
	infoRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 12,
		paddingVertical: 10,
	},
	infoDivider: {
		borderTopWidth: 1,
	},
	statusBadge: {
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 4,
	},
	formGroup: {
		marginBottom: 12,
	},
	toggleButton: {
		marginBottom: 16,
	},
	saveButton: {
		paddingVertical: 12,
		borderRadius: 8,
		alignItems: "center",
	},
	modelsList: {
		borderRadius: 8,
		overflow: "hidden",
	},
	modelItem: {
		paddingHorizontal: 12,
		paddingVertical: 10,
		gap: 2,
	},
	modelDivider: {
		borderTopWidth: 1,
	},
	bottomSpacer: {
		height: 40,
	},
});
