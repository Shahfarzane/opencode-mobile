import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type AuthMethod, type Provider, providersApi } from "@/api";
import {
	CheckIcon,
	ChevronDownIcon,
	ChevronLeft,
	ChevronUpIcon,
} from "@/components/icons";
import { Button, Input, ProviderLogo, SearchInput } from "@/components/ui";
import { Fonts, FontSizes, Spacing, typography, useTheme } from "@/theme";
import { OPACITY, withOpacity } from "@/utils/colors";

interface ProviderOption {
	id: string;
	name?: string;
}

function normalizeAuthType(method: AuthMethod): "oauth" | "api" | string {
	const raw = typeof method.type === "string" ? method.type : "";
	const label = `${method.name ?? ""} ${method.label ?? ""}`.toLowerCase();
	const merged = `${raw} ${label}`.toLowerCase();
	if (merged.includes("oauth")) return "oauth";
	if (merged.includes("api")) return "api";
	return raw.toLowerCase();
}

export default function AddProviderScreen() {
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();

	// State
	const [allProviders, setAllProviders] = useState<Provider[]>([]);
	const [connectedProviders, setConnectedProviders] = useState<Provider[]>([]);
	const [authMethods, setAuthMethods] = useState<Record<string, AuthMethod[]>>(
		{},
	);
	const [isLoading, setIsLoading] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [selectedProviderId, setSelectedProviderId] = useState<string | null>(
		null,
	);
	const [selectorExpanded, setSelectorExpanded] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [apiKey, setApiKey] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const [oauthPending, setOauthPending] = useState<{
		providerId: string;
		methodIndex: number;
	} | null>(null);
	const [oauthDetails, setOauthDetails] = useState<{
		url?: string;
		instructions?: string;
		userCode?: string;
	} | null>(null);
	const [oauthCode, setOauthCode] = useState("");

	// Load providers and auth methods
	useEffect(() => {
		async function loadData() {
			setIsLoading(true);
			setLoadError(null);
			try {
				const [all, connected, auth] = await Promise.all([
					providersApi.list(),
					providersApi.listConnected(),
					providersApi.getAuthMethods(),
				]);

				if (__DEV__) {
					console.log("[AddProvider] Loaded data:", {
						allProviders: all.length,
						connectedProviders: connected.length,
						authMethodsKeys: Object.keys(auth),
					});
				}

				setAllProviders(all);
				setConnectedProviders(connected);
				setAuthMethods(auth);

				if (all.length === 0) {
					setLoadError("No providers available");
				}
			} catch (error) {
				console.error("Failed to load providers:", error);
				setLoadError("Failed to load providers");
			} finally {
				setIsLoading(false);
			}
		}
		loadData();
	}, []);

	// Get unconnected providers
	const connectedIds = useMemo(
		() => new Set(connectedProviders.map((p) => p.id)),
		[connectedProviders],
	);

	const unconnectedProviders = useMemo((): ProviderOption[] => {
		const providers = allProviders.filter((p) => !connectedIds.has(p.id));
		return providers.map((p) => ({ id: p.id, name: p.name }));
	}, [allProviders, connectedIds]);

	// Filter by search
	const filteredProviders = useMemo(() => {
		if (!searchQuery.trim()) return unconnectedProviders;
		const query = searchQuery.toLowerCase();
		return unconnectedProviders.filter(
			(p) =>
				p.id.toLowerCase().includes(query) ||
				(p.name?.toLowerCase().includes(query) ?? false),
		);
	}, [unconnectedProviders, searchQuery]);

	// Get selected provider details
	const selectedProvider = useMemo(() => {
		if (!selectedProviderId) return null;
		return unconnectedProviders.find((p) => p.id === selectedProviderId);
	}, [selectedProviderId, unconnectedProviders]);

	// Get OAuth methods for selected provider
	const selectedOAuthMethods = useMemo(() => {
		if (!selectedProviderId) return [];
		const methods = authMethods[selectedProviderId] ?? [];
		return methods.filter((m) => normalizeAuthType(m) === "oauth");
	}, [selectedProviderId, authMethods]);

	// Handlers
	const handleSelectProvider = useCallback((providerId: string) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setSelectedProviderId(providerId);
		setSelectorExpanded(false);
		setSearchQuery("");
		setApiKey("");
		setOauthPending(null);
		setOauthDetails(null);
		setOauthCode("");
	}, []);

	const handleToggleSelector = useCallback(() => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setSelectorExpanded((prev) => !prev);
		if (!selectorExpanded) {
			setSearchQuery("");
		}
	}, [selectorExpanded]);

	const handleSaveApiKey = useCallback(async () => {
		if (!selectedProviderId || !apiKey.trim()) {
			Alert.alert("Error", "Please enter an API key");
			return;
		}

		setIsSaving(true);
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

		try {
			const result = await providersApi.saveApiKey(
				selectedProviderId,
				apiKey.trim(),
			);
			if (result.success) {
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
				Alert.alert("Success", "API key saved successfully", [
					{ text: "OK", onPress: () => router.back() },
				]);
			} else {
				throw new Error(result.error || "Failed to save API key");
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
	}, [selectedProviderId, apiKey]);

	const handleStartOAuth = useCallback(
		async (methodIndex: number) => {
			if (!selectedProviderId) return;

			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
			setIsSaving(true);

			try {
				const result = await providersApi.startOAuth(
					selectedProviderId,
					methodIndex,
				);
				if (!result.success) {
					throw new Error(result.error || "Failed to start OAuth flow");
				}

				setOauthPending({ providerId: selectedProviderId, methodIndex });
				setOauthDetails({
					url: result.url,
					instructions: result.instructions,
					userCode: result.userCode,
				});

				if (result.url) {
					await Linking.openURL(result.url);
				}

				Alert.alert(
					"OAuth Started",
					"Complete the authentication in your browser, then return here to finish.",
				);
			} catch (error) {
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
				Alert.alert(
					"Error",
					error instanceof Error ? error.message : "Failed to start OAuth flow",
				);
			} finally {
				setIsSaving(false);
			}
		},
		[selectedProviderId],
	);

	const handleCompleteOAuth = useCallback(async () => {
		if (!oauthPending) return;

		setIsSaving(true);
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

		try {
			const result = await providersApi.completeOAuth(
				oauthPending.providerId,
				oauthPending.methodIndex,
				oauthCode.trim() || undefined,
			);

			if (result.success) {
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
				Alert.alert("Success", "OAuth connection completed", [
					{ text: "OK", onPress: () => router.back() },
				]);
			} else {
				throw new Error(result.error || "Failed to complete OAuth flow");
			}
		} catch (error) {
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
			Alert.alert(
				"Error",
				error instanceof Error
					? error.message
					: "Failed to complete OAuth flow",
			);
		} finally {
			setIsSaving(false);
		}
	}, [oauthPending, oauthCode]);

	const handleCopyToClipboard = useCallback(
		async (text: string, label: string) => {
			await Clipboard.setStringAsync(text);
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
			Alert.alert("Copied", `${label} copied to clipboard`);
		},
		[],
	);

	// Render inline provider selector with search
	const renderProviderSelector = () => {
		if (unconnectedProviders.length === 0) {
			return (
				<Text style={[typography.meta, { color: colors.mutedForeground }]}>
					All available providers are already connected.
				</Text>
			);
		}

		return (
			<View
				style={[
					styles.selectorContainer,
					{
						backgroundColor: colors.muted,
						borderColor: colors.border,
					},
				]}
			>
				{/* Selector Header/Trigger */}
				<Pressable
					onPress={handleToggleSelector}
					style={styles.selectorTrigger}
				>
					{selectedProvider && (
						<ProviderLogo providerId={selectedProvider.id} size={16} />
					)}
					<Text
						style={[
							typography.uiLabel,
							{
								flex: 1,
								color: selectedProvider
									? colors.foreground
									: colors.mutedForeground,
							},
						]}
						numberOfLines={1}
					>
						{selectedProvider
							? selectedProvider.name || selectedProvider.id
							: "Select provider"}
					</Text>
					{selectorExpanded ? (
						<ChevronUpIcon size={16} color={colors.mutedForeground} />
					) : (
						<ChevronDownIcon size={16} color={colors.mutedForeground} />
					)}
				</Pressable>

				{/* Expanded content with search and list */}
				{selectorExpanded && (
					<View style={[styles.selectorExpanded, { borderTopColor: colors.border }]}>
						{/* Search input */}
						<View
							style={[
								styles.searchContainer,
								{ borderBottomColor: colors.border },
							]}
						>
							<SearchInput
								value={searchQuery}
								onChangeText={setSearchQuery}
								placeholder="Search providers..."
							/>
						</View>

						{/* Provider list */}
						<ScrollView
							style={styles.providerList}
							nestedScrollEnabled
							keyboardShouldPersistTaps="handled"
						>
							{filteredProviders.length === 0 ? (
								<View style={styles.emptyState}>
									<Text
										style={[typography.meta, { color: colors.mutedForeground }]}
									>
										No providers found
									</Text>
								</View>
							) : (
								filteredProviders.map((provider) => {
									const isSelected = provider.id === selectedProviderId;
									return (
										<Pressable
											key={provider.id}
											onPress={() => handleSelectProvider(provider.id)}
											style={({ pressed }) => [
												styles.providerOption,
												pressed && { backgroundColor: withOpacity(colors.foreground, 0.05) },
												isSelected && {
													backgroundColor: withOpacity(
														colors.primary,
														OPACITY.active,
													),
												},
											]}
										>
											<ProviderLogo providerId={provider.id} size={16} />
											<Text
												style={[
													typography.uiLabel,
													{
														flex: 1,
														color: isSelected
															? colors.primary
															: colors.foreground,
													},
												]}
											>
												{provider.name || provider.id}
											</Text>
											{isSelected && (
												<CheckIcon size={16} color={colors.primary} />
											)}
										</Pressable>
									);
								})
							)}
						</ScrollView>
					</View>
				)}
			</View>
		);
	};

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			{/* Header */}
			<View
				style={[
					styles.header,
					{
						paddingTop: insets.top + Spacing[2],
						borderBottomColor: colors.border,
					},
				]}
			>
				<Pressable
					onPress={() => router.back()}
					style={styles.headerButton}
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
				>
					<ChevronLeft size={24} color={colors.foreground} />
				</Pressable>
				<Text style={[styles.headerTitle, { color: colors.foreground }]}>
					Connect provider
				</Text>
				<View style={styles.headerButton} />
			</View>

			{isLoading ? (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color={colors.primary} />
					<Text
						style={[
							typography.meta,
							{ color: colors.mutedForeground, marginTop: Spacing[3] },
						]}
					>
						Loading providers...
					</Text>
				</View>
			) : loadError && allProviders.length === 0 ? (
				<View style={styles.loadingContainer}>
					<Text
						style={[
							typography.uiLabel,
							{ color: colors.mutedForeground, textAlign: "center" },
						]}
					>
						{loadError}
					</Text>
					<Button
						variant="outline"
						size="sm"
						onPress={() => router.back()}
						style={{ marginTop: Spacing[4] }}
					>
						Go back
					</Button>
				</View>
			) : (
				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={[
						styles.scrollContent,
						{ paddingBottom: insets.bottom + Spacing[4] },
					]}
					keyboardShouldPersistTaps="handled"
				>
					{/* Page Title Section */}
					<View style={styles.titleSection}>
						<Text style={[styles.pageTitle, { color: colors.foreground }]}>
							Connect provider
						</Text>
						<Text
							style={[styles.pageDescription, { color: colors.mutedForeground }]}
						>
							Choose a provider to connect and set up its authentication.
						</Text>
					</View>

					{/* Provider Selection Section */}
					<View style={styles.section}>
						<Text style={[styles.sectionTitle, { color: colors.foreground }]}>
							Provider
						</Text>
						<Text
							style={[
								styles.sectionDescription,
								{ color: colors.mutedForeground },
							]}
						>
							Select a provider that is not connected yet.
						</Text>

						{renderProviderSelector()}
					</View>

					{/* Authentication Section - only show when provider selected */}
					{selectedProvider && (
						<View style={styles.section}>
							<Text style={[styles.sectionTitle, { color: colors.foreground }]}>
								Authentication
							</Text>

							{/* API Key Input */}
							<View style={styles.authBlock}>
								<View style={styles.apiKeyRow}>
									<View style={{ flex: 1 }}>
										<Input
											label="API key"
											placeholder="sk-..."
											value={apiKey}
											onChangeText={setApiKey}
											secureTextEntry
											autoCapitalize="none"
											autoCorrect={false}
											helperText="Keys are sent directly to OpenCode and never stored by OpenChamber."
										/>
									</View>
									<Button
										variant="primary"
										size="sm"
										onPress={handleSaveApiKey}
										isDisabled={isSaving || !apiKey.trim()}
										isLoading={isSaving}
										style={{ marginTop: 24 }}
									>
										Save key
									</Button>
								</View>
							</View>

							{/* OAuth Methods */}
							{selectedOAuthMethods.length > 0 && (
								<View
									style={[
										styles.oauthSection,
										{ borderTopColor: colors.border },
									]}
								>
									{selectedOAuthMethods.map((method, index) => {
										const methodLabel =
											method.label || method.name || `OAuth ${index + 1}`;
										const isPending =
											oauthPending?.providerId === selectedProviderId &&
											oauthPending?.methodIndex === index;

										return (
											<View
												key={`${selectedProviderId}-oauth-${method.label}`}
												style={styles.oauthMethod}
											>
												<View style={styles.oauthHeader}>
													<View style={{ flex: 1 }}>
														<Text
															style={[
																styles.fieldLabel,
																{ color: colors.foreground },
															]}
														>
															{methodLabel}
														</Text>
														{(method.description || method.help) && (
															<Text
																style={[
																	typography.meta,
																	{ color: colors.mutedForeground },
																]}
															>
																{method.description || method.help}
															</Text>
														)}
													</View>
													<Button
														variant="outline"
														size="sm"
														onPress={() => handleStartOAuth(index)}
														isDisabled={isSaving}
													>
														Connect
													</Button>
												</View>

												{/* OAuth Details when pending */}
												{isPending && oauthDetails && (
													<View
														style={[
															styles.oauthDetails,
															{ backgroundColor: colors.muted },
														]}
													>
														{oauthDetails.instructions && (
															<Text
																style={[
																	typography.meta,
																	{
																		color: colors.mutedForeground,
																		marginBottom: Spacing[2],
																	},
																]}
															>
																{oauthDetails.instructions}
															</Text>
														)}

														{oauthDetails.userCode && (
															<View style={styles.oauthCodeRow}>
																<View style={{ flex: 1 }}>
																	<Input
																		value={oauthDetails.userCode}
																		editable={false}
																	/>
																</View>
																<Button
																	variant="outline"
																	size="sm"
																	onPress={() =>
																		handleCopyToClipboard(
																			oauthDetails.userCode!,
																			"Code",
																		)
																	}
																>
																	Copy code
																</Button>
															</View>
														)}

														{oauthDetails.url && (
															<View style={styles.oauthCodeRow}>
																<Button
																	variant="outline"
																	size="sm"
																	onPress={() =>
																		Linking.openURL(oauthDetails.url!)
																	}
																	style={{ flex: 1 }}
																>
																	Open link
																</Button>
																<Button
																	variant="outline"
																	size="sm"
																	onPress={() =>
																		handleCopyToClipboard(
																			oauthDetails.url!,
																			"Link",
																		)
																	}
																>
																	Copy link
																</Button>
															</View>
														)}

														{/* Authorization code input */}
														<View style={{ marginTop: Spacing[3] }}>
															<Input
																placeholder="Authorization code (if required)"
																value={oauthCode}
																onChangeText={setOauthCode}
																autoCapitalize="none"
																autoCorrect={false}
															/>
														</View>

														<Button
															variant="primary"
															size="sm"
															onPress={handleCompleteOAuth}
															isDisabled={isSaving}
															isLoading={isSaving}
															style={{ marginTop: Spacing[3] }}
														>
															Complete
														</Button>
													</View>
												)}
											</View>
										);
									})}
								</View>
							)}
						</View>
					)}
				</ScrollView>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: Spacing[4],
		paddingBottom: Spacing[3],
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	headerButton: {
		width: 40,
		height: 40,
		alignItems: "center",
		justifyContent: "center",
	},
	headerTitle: {
		fontSize: FontSizes.h2,
		fontFamily: Fonts.semiBold,
		textAlign: "center",
	},
	loadingContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: Spacing[4],
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		paddingTop: Spacing[6],
		paddingHorizontal: Spacing[4],
	},
	titleSection: {
		marginBottom: Spacing[6],
	},
	pageTitle: {
		fontSize: FontSizes.h1,
		fontFamily: Fonts.semiBold,
		marginBottom: Spacing[1],
	},
	pageDescription: {
		fontSize: FontSizes.uiLabel,
		fontFamily: Fonts.regular,
	},
	section: {
		marginBottom: Spacing[6],
	},
	sectionTitle: {
		fontSize: FontSizes.uiLabel,
		fontFamily: Fonts.semiBold,
		marginBottom: Spacing[1],
	},
	sectionDescription: {
		fontSize: FontSizes.meta,
		fontFamily: Fonts.regular,
		marginBottom: Spacing[3],
	},
	// Inline selector styles
	selectorContainer: {
		borderRadius: 8,
		borderWidth: 1,
		overflow: "hidden",
	},
	selectorTrigger: {
		flexDirection: "row",
		alignItems: "center",
		gap: Spacing[2],
		paddingHorizontal: Spacing[3],
		paddingVertical: Spacing[2.5],
	},
	selectorExpanded: {
		borderTopWidth: StyleSheet.hairlineWidth,
	},
	searchContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: Spacing[2],
		paddingHorizontal: Spacing[3],
		paddingVertical: Spacing[2],
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	searchInput: {
		flex: 1,
		fontSize: FontSizes.meta,
		fontFamily: Fonts.regular,
		padding: 0,
	},
	providerList: {
		maxHeight: 200,
	},
	providerOption: {
		flexDirection: "row",
		alignItems: "center",
		gap: Spacing[2],
		paddingHorizontal: Spacing[3],
		paddingVertical: Spacing[2.5],
	},
	emptyState: {
		padding: Spacing[4],
		alignItems: "center",
	},
	authBlock: {
		marginBottom: Spacing[4],
	},
	fieldLabel: {
		fontSize: FontSizes.uiLabel,
		fontFamily: Fonts.medium,
		marginBottom: Spacing[2],
	},
	apiKeyRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: Spacing[2],
	},
	input: {
		borderWidth: 1,
		borderRadius: 8,
		paddingHorizontal: Spacing[3],
		paddingVertical: Spacing[2.5],
		fontSize: FontSizes.uiLabel,
		fontFamily: Fonts.regular,
	},
	helperText: {
		fontSize: FontSizes.meta,
		fontFamily: Fonts.regular,
		marginTop: Spacing[2],
	},
	oauthSection: {
		borderTopWidth: StyleSheet.hairlineWidth,
		paddingTop: Spacing[4],
	},
	oauthMethod: {
		marginBottom: Spacing[4],
	},
	oauthHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: Spacing[3],
	},
	oauthDetails: {
		marginTop: Spacing[3],
		padding: Spacing[3],
		borderRadius: 8,
	},
	oauthCodeRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: Spacing[2],
		marginTop: Spacing[2],
	},
});
