import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { type Provider, providersApi } from "@/api";
import { ChevronLeft } from "@/components/icons";
import { Fonts, fontStyle, Spacing, typography, useTheme } from "@/theme";

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
			<View style={styles.centered}>
				<ActivityIndicator size="small" color={colors.primary} />
			</View>
		);
	}

	if (!provider) {
		return (
			<View style={styles.container}>
				<Pressable onPress={onBack} style={styles.backButton} hitSlop={8}>
					<ChevronLeft size={18} color={colors.foreground} />
					<Text style={[typography.uiLabel, { color: colors.foreground }]}>
						Provider
					</Text>
				</Pressable>
				<View style={styles.centered}>
					<Text style={[typography.meta, { color: colors.mutedForeground }]}>
						Provider not found
					</Text>
				</View>
			</View>
		);
	}

	const modelCount = provider.models?.length ?? 0;

	return (
		<View style={styles.container}>
			{/* Header */}
			<Pressable onPress={onBack} style={styles.backButton} hitSlop={8}>
				<ChevronLeft size={18} color={colors.foreground} />
				<Text
					style={[
						typography.uiLabel,
						fontStyle("600"),
						{ color: colors.foreground },
					]}
				>
					{provider.name || provider.id}
				</Text>
			</Pressable>

			<ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				{/* Provider ID */}
				<Text style={[typography.meta, { color: colors.mutedForeground }]}>
					Provider ID: {provider.id}
				</Text>

				{/* API Key Section */}
				<View style={styles.section}>
					<Text
						style={[
							typography.uiLabel,
							styles.sectionTitle,
							{ color: colors.foreground },
						]}
					>
						API key
					</Text>
					<View style={styles.inputRow}>
						<TextInput
							style={[
								typography.uiLabel,
								styles.input,
								{
									color: colors.foreground,
									borderColor: colors.border,
								},
							]}
							value={apiKey}
							onChangeText={setApiKey}
							placeholder="sk-..."
							placeholderTextColor={colors.mutedForeground}
							secureTextEntry
							autoCapitalize="none"
							autoCorrect={false}
						/>
						<Pressable
							onPress={handleSaveApiKey}
							disabled={isSaving || !apiKey.trim()}
							style={[
								styles.button,
								{
									backgroundColor: apiKey.trim()
										? colors.primary
										: colors.muted,
									opacity: isSaving ? 0.6 : 1,
								},
							]}
						>
							{isSaving ? (
								<ActivityIndicator size="small" color={colors.background} />
							) : (
								<Text
									style={[
										typography.meta,
										{
											color: apiKey.trim()
												? colors.primaryForeground
												: colors.mutedForeground,
										},
										fontStyle("500"),
									]}
								>
									Save
								</Text>
							)}
						</Pressable>
					</View>
					<Text
						style={[
							typography.micro,
							{ color: colors.mutedForeground, marginTop: 6 },
						]}
					>
						Keys are sent directly to the server and never stored locally.
					</Text>
				</View>

				{/* Models Section */}
				{modelCount > 0 && (
					<View
						style={[styles.section, { borderTopColor: colors.border + "66" }]}
					>
						<Text
							style={[
								typography.uiLabel,
								styles.sectionTitle,
								{ color: colors.foreground },
							]}
						>
							Models
						</Text>
						<Text
							style={[
								typography.meta,
								{ color: colors.mutedForeground, marginBottom: 12 },
							]}
						>
							{modelCount} model{modelCount !== 1 ? "s" : ""} available
						</Text>
						<View
							style={[styles.modelList, { borderColor: colors.border + "66" }]}
						>
							{provider.models?.map((model, index) => (
								<View
									key={model.id}
									style={[
										styles.modelItem,
										index > 0 && {
											borderTopColor: colors.border + "66",
											borderTopWidth: 1,
										},
									]}
								>
									<Text
										style={[
											typography.meta,
											fontStyle("500"),
											{ color: colors.foreground },
										]}
										numberOfLines={1}
									>
										{model.name || model.id}
									</Text>
									{model.contextLength && (
										<Text
											style={[
												typography.micro,
												{ color: colors.mutedForeground },
											]}
										>
											{(model.contextLength / 1000).toFixed(0)}k ctx
										</Text>
									)}
								</View>
							))}
						</View>
					</View>
				)}
			</ScrollView>
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
	backButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingHorizontal: Spacing[4],
		paddingVertical: Spacing[2],
	},
	scroll: {
		flex: 1,
	},
	content: {
		paddingHorizontal: Spacing[4],
		paddingBottom: Spacing[8],
		gap: Spacing[6],
	},
	section: {
		paddingTop: Spacing[4],
		borderTopWidth: 1,
	},
	sectionTitle: {
		fontFamily: Fonts.semiBold,
		marginBottom: 8,
	},
	inputRow: {
		flexDirection: "row",
		gap: 8,
	},
	input: {
		flex: 1,
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderWidth: 1,
		borderRadius: 6,
	},
	button: {
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 6,
		alignItems: "center",
		justifyContent: "center",
		minWidth: 60,
	},
	modelList: {
		borderWidth: 1,
		borderRadius: 6,
		overflow: "hidden",
	},
	modelItem: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 12,
		paddingVertical: 10,
	},
});
