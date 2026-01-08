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
	TextInput,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type AuthMethod, type Provider, providersApi } from "@/api";
import { ChevronLeft, ChevronRightIcon, SearchIcon } from "@/components/icons";
import { Fonts, Spacing, typography, useTheme } from "@/theme";

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
	const [selectedProviderId, setSelectedProviderId] = useState<string | null>(
		null,
	);
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
			try {
				const [all, connected, auth] = await Promise.all([
					providersApi.list(),
					providersApi.listConnected(),
					providersApi.getAuthMethods(),
				]);
				setAllProviders(all);
				setConnectedProviders(connected);
				setAuthMethods(auth);
			} catch (error) {
				console.error("Failed to load providers:", error);
				Alert.alert("Error", "Failed to load providers");
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
		setApiKey("");
		setOauthPending(null);
		setOauthDetails(null);
		setOauthCode("");
	}, []);

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

	// Render provider list
	const renderProviderList = () => (
		<View style={styles.section}>
			<Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
				SELECT PROVIDER
			</Text>
			<Text
				style={[
					typography.meta,
					{ color: colors.mutedForeground, marginBottom: 12 },
				]}
			>
				Choose a provider to connect
			</Text>

			{/* Search */}
			<View
				style={[
					styles.searchContainer,
					{ backgroundColor: colors.muted, borderColor: colors.border },
				]}
			>
				<SearchIcon size={18} color={colors.mutedForeground} />
				<TextInput
					style={[styles.searchInput, { color: colors.foreground }]}
					placeholder="Search providers..."
					placeholderTextColor={colors.mutedForeground}
					value={searchQuery}
					onChangeText={setSearchQuery}
					autoCapitalize="none"
					autoCorrect={false}
				/>
			</View>

			{/* Provider list */}
			{filteredProviders.length === 0 ? (
				<View style={styles.emptyContainer}>
					<Text style={[typography.meta, { color: colors.mutedForeground }]}>
						{searchQuery
							? "No providers match your search"
							: "All providers are already connected"}
					</Text>
				</View>
			) : (
				<View style={[styles.listContainer, { borderColor: colors.border }]}>
					{filteredProviders.map((provider, index) => (
						<Pressable
							key={provider.id}
							onPress={() => handleSelectProvider(provider.id)}
							style={({ pressed }) => [
								styles.providerRow,
								{
									borderBottomColor: colors.border,
									borderBottomWidth:
										index < filteredProviders.length - 1
											? StyleSheet.hairlineWidth
											: 0,
								},
								pressed && { opacity: 0.7 },
							]}
						>
							<Text
								style={[
									typography.uiLabel,
									{ color: colors.foreground, flex: 1 },
								]}
							>
								{provider.name || provider.id}
							</Text>
							<ChevronRightIcon size={18} color={colors.mutedForeground} />
						</Pressable>
					))}
				</View>
			)}
		</View>
	);

	// Render auth form for selected provider
	const renderAuthForm = () => {
		const provider = unconnectedProviders.find(
			(p) => p.id === selectedProviderId,
		);
		if (!provider) return null;

		return (
			<View style={styles.section}>
				{/* Header */}
				<Pressable
					onPress={() => {
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
						setSelectedProviderId(null);
					}}
					style={styles.backToList}
				>
					<ChevronLeft size={18} color={colors.primary} />
					<Text style={[typography.meta, { color: colors.primary }]}>
						Back to providers
					</Text>
				</Pressable>

				<Text
					style={[
						styles.sectionTitle,
						{ color: colors.mutedForeground, marginTop: 16 },
					]}
				>
					CONNECT {(provider.name || provider.id).toUpperCase()}
				</Text>

				{/* API Key Section */}
				<View style={styles.authSection}>
					<Text
						style={[
							typography.uiLabel,
							{ color: colors.foreground, fontWeight: "600" },
						]}
					>
						API Key
					</Text>
					<TextInput
						style={[
							styles.input,
							{
								color: colors.foreground,
								backgroundColor: colors.muted,
								borderColor: colors.border,
							},
						]}
						placeholder="sk-..."
						placeholderTextColor={colors.mutedForeground}
						value={apiKey}
						onChangeText={setApiKey}
						secureTextEntry
						autoCapitalize="none"
						autoCorrect={false}
					/>
					<Pressable
						onPress={handleSaveApiKey}
						disabled={isSaving || !apiKey.trim()}
						style={({ pressed }) => [
							styles.button,
							{ backgroundColor: colors.primary },
							(isSaving || !apiKey.trim()) && { opacity: 0.5 },
							pressed && { opacity: 0.8 },
						]}
					>
						<Text
							style={[
								typography.uiLabel,
								{ color: colors.primaryForeground, fontWeight: "600" },
							]}
						>
							{isSaving ? "Saving..." : "Save API Key"}
						</Text>
					</Pressable>
					<Text
						style={[
							typography.micro,
							{ color: colors.mutedForeground, marginTop: 8 },
						]}
					>
						Keys are sent directly to OpenCode and never stored by OpenChamber.
					</Text>
				</View>

				{/* OAuth Methods */}
				{selectedOAuthMethods.length > 0 && (
					<View style={[styles.authSection, { marginTop: 24 }]}>
						<Text
							style={[
								typography.uiLabel,
								{
									color: colors.foreground,
									fontWeight: "600",
									marginBottom: 12,
								},
							]}
						>
							Or connect with OAuth
						</Text>

						{selectedOAuthMethods.map((method, index) => {
							const methodLabel =
								method.label || method.name || `OAuth ${index + 1}`;
							const isPending =
								oauthPending?.providerId === selectedProviderId &&
								oauthPending?.methodIndex === index;

							return (
								<View
									key={`${selectedProviderId}-oauth-${index}`}
									style={styles.oauthMethod}
								>
									<View style={styles.oauthHeader}>
										<View style={{ flex: 1 }}>
											<Text
												style={[
													typography.uiLabel,
													{ color: colors.foreground },
												]}
											>
												{methodLabel}
											</Text>
											{(method.description || method.help) && (
												<Text
													style={[
														typography.micro,
														{ color: colors.mutedForeground },
													]}
												>
													{method.description || method.help}
												</Text>
											)}
										</View>
										<Pressable
											onPress={() => handleStartOAuth(index)}
											disabled={isSaving}
											style={({ pressed }) => [
												styles.oauthButton,
												{ borderColor: colors.border },
												pressed && { opacity: 0.7 },
											]}
										>
											<Text
												style={[typography.meta, { color: colors.foreground }]}
											>
												Connect
											</Text>
										</Pressable>
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
														{ color: colors.mutedForeground, marginBottom: 8 },
													]}
												>
													{oauthDetails.instructions}
												</Text>
											)}

											{oauthDetails.userCode && (
												<View style={styles.oauthCodeRow}>
													<Text
														style={[
															typography.code,
															{ color: colors.foreground, flex: 1 },
														]}
													>
														{oauthDetails.userCode}
													</Text>
													<Pressable
														onPress={() =>
															handleCopyToClipboard(
																oauthDetails.userCode!,
																"Code",
															)
														}
														style={({ pressed }) => [
															styles.copyButton,
															{ borderColor: colors.border },
															pressed && { opacity: 0.7 },
														]}
													>
														<Text
															style={[
																typography.micro,
																{ color: colors.foreground },
															]}
														>
															Copy
														</Text>
													</Pressable>
												</View>
											)}

											{oauthDetails.url && (
												<View style={styles.oauthCodeRow}>
													<Pressable
														onPress={() => Linking.openURL(oauthDetails.url!)}
														style={({ pressed }) => [
															styles.linkButton,
															{ borderColor: colors.border },
															pressed && { opacity: 0.7 },
														]}
													>
														<Text
															style={[
																typography.meta,
																{ color: colors.primary },
															]}
														>
															Open Link
														</Text>
													</Pressable>
													<Pressable
														onPress={() =>
															handleCopyToClipboard(oauthDetails.url!, "Link")
														}
														style={({ pressed }) => [
															styles.copyButton,
															{ borderColor: colors.border },
															pressed && { opacity: 0.7 },
														]}
													>
														<Text
															style={[
																typography.micro,
																{ color: colors.foreground },
															]}
														>
															Copy
														</Text>
													</Pressable>
												</View>
											)}

											{/* Authorization code input */}
											<TextInput
												style={[
													styles.input,
													{
														color: colors.foreground,
														backgroundColor: colors.background,
														borderColor: colors.border,
														marginTop: 12,
													},
												]}
												placeholder="Authorization code (if required)"
												placeholderTextColor={colors.mutedForeground}
												value={oauthCode}
												onChangeText={setOauthCode}
												autoCapitalize="none"
												autoCorrect={false}
											/>

											<Pressable
												onPress={handleCompleteOAuth}
												disabled={isSaving}
												style={({ pressed }) => [
													styles.button,
													{ backgroundColor: colors.primary, marginTop: 12 },
													isSaving && { opacity: 0.5 },
													pressed && { opacity: 0.8 },
												]}
											>
												<Text
													style={[
														typography.uiLabel,
														{
															color: colors.primaryForeground,
															fontWeight: "600",
														},
													]}
												>
													{isSaving ? "Completing..." : "Complete OAuth"}
												</Text>
											</Pressable>
										</View>
									)}
								</View>
							);
						})}
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
				<Text style={[styles.title, { color: colors.foreground }]}>
					Add Provider
				</Text>
				<View style={styles.headerButton} />
			</View>

			{isLoading ? (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color={colors.primary} />
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
					{selectedProviderId ? renderAuthForm() : renderProviderList()}
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
	title: {
		fontSize: 17,
		fontFamily: Fonts.semiBold,
		textAlign: "center",
	},
	loadingContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		paddingTop: Spacing[4],
	},
	section: {
		paddingHorizontal: Spacing[4],
	},
	sectionTitle: {
		fontSize: 13,
		fontFamily: Fonts.medium,
		letterSpacing: 0.5,
		marginBottom: Spacing[1],
	},
	searchContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderRadius: 8,
		borderWidth: 1,
		marginBottom: 16,
	},
	searchInput: {
		flex: 1,
		fontSize: 15,
		fontFamily: Fonts.regular,
		padding: 0,
	},
	listContainer: {
		borderRadius: 8,
		borderWidth: 1,
		overflow: "hidden",
	},
	providerRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 14,
	},
	emptyContainer: {
		alignItems: "center",
		paddingVertical: 32,
	},
	backToList: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	authSection: {
		marginTop: 16,
	},
	input: {
		borderWidth: 1,
		borderRadius: 8,
		paddingHorizontal: 14,
		paddingVertical: 12,
		fontSize: 15,
		fontFamily: Fonts.regular,
		marginTop: 8,
	},
	button: {
		borderRadius: 8,
		paddingVertical: 12,
		alignItems: "center",
		marginTop: 12,
	},
	oauthMethod: {
		marginBottom: 16,
	},
	oauthHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	oauthButton: {
		borderWidth: 1,
		borderRadius: 6,
		paddingHorizontal: 12,
		paddingVertical: 6,
	},
	oauthDetails: {
		marginTop: 12,
		padding: 12,
		borderRadius: 8,
	},
	oauthCodeRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginTop: 8,
	},
	copyButton: {
		borderWidth: 1,
		borderRadius: 4,
		paddingHorizontal: 8,
		paddingVertical: 4,
	},
	linkButton: {
		borderWidth: 1,
		borderRadius: 4,
		paddingHorizontal: 12,
		paddingVertical: 6,
		flex: 1,
		alignItems: "center",
	},
});
