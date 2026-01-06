import * as Haptics from "expo-haptics";
import { useCallback, useMemo, useState } from "react";
import {
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { typography, useTheme } from "@/theme";

interface Model {
	id: string;
	name: string;
}

interface Provider {
	id: string;
	name: string;
	models?: Model[];
	enabled?: boolean;
}

interface ModelPickerProps {
	providers: Provider[];
	currentProviderId?: string;
	currentModelId?: string;
	onModelChange: (providerId: string, modelId: string) => void;
	visible: boolean;
	onClose: () => void;
}

function ChevronDownIcon({ color, size = 16, style }: { color: string; size?: number; style?: object }) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
			<Path
				d="M6 9l6 6 6-6"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

function CheckIcon({ color, size = 16 }: { color: string; size?: number }) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Path
				d="M20 6L9 17l-5-5"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

function SearchIcon({ color, size = 16 }: { color: string; size?: number }) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Path
				d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

function ClearIcon({ color, size = 16 }: { color: string; size?: number }) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Path
				d="M18 6L6 18M6 6l12 12"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

// Provider logo component matching desktop UI
function ProviderLogo({ providerId }: { providerId: string }) {
	const { colors } = useTheme();

	const getProviderSymbol = (id: string) => {
		const normalizedId = id.toLowerCase();
		if (normalizedId.includes("anthropic")) return "A\\";
		if (normalizedId.includes("openai")) return "O";
		if (normalizedId.includes("google") || normalizedId.includes("gemini")) return "G";
		if (normalizedId.includes("mistral")) return "M";
		if (normalizedId.includes("groq")) return "Gr";
		if (normalizedId.includes("ollama")) return "Ol";
		if (normalizedId.includes("openrouter")) return "OR";
		if (normalizedId.includes("deepseek")) return "DS";
		return id.charAt(0).toUpperCase();
	};

	return (
		<View style={[styles.providerLogo, { backgroundColor: colors.muted }]}>
			<Text style={[typography.micro, { color: colors.foreground, fontWeight: "600" }]}>
				{getProviderSymbol(providerId)}
			</Text>
		</View>
	);
}

interface FlattenedModel {
	providerId: string;
	providerName: string;
	modelId: string;
	modelName: string;
}

export function ModelPicker({
	providers,
	currentProviderId,
	currentModelId,
	onModelChange,
	visible,
	onClose,
}: ModelPickerProps) {
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();
	const [expandedProvider, setExpandedProvider] = useState<string | null>(
		currentProviderId || null,
	);
	const [searchQuery, setSearchQuery] = useState("");

	// Filter to only show providers that are enabled and have models
	const availableProviders = providers.filter(
		(provider) => provider.enabled && provider.models && provider.models.length > 0,
	);

	// Flatten all models for search
	const allModels = useMemo<FlattenedModel[]>(() => {
		const models: FlattenedModel[] = [];
		for (const provider of availableProviders) {
			if (provider.models) {
				for (const model of provider.models) {
					models.push({
						providerId: provider.id,
						providerName: provider.name,
						modelId: model.id,
						modelName: model.name || model.id,
					});
				}
			}
		}
		return models;
	}, [availableProviders]);

	// Filter models based on search query
	const filteredModels = useMemo(() => {
		if (!searchQuery.trim()) return [];
		const query = searchQuery.toLowerCase();
		return allModels.filter(
			(model) =>
				model.modelName.toLowerCase().includes(query) ||
				model.modelId.toLowerCase().includes(query) ||
				model.providerName.toLowerCase().includes(query),
		);
	}, [allModels, searchQuery]);

	const isSearching = searchQuery.trim().length > 0;

	const handleModelSelect = useCallback(
		(providerId: string, modelId: string) => {
			Haptics.selectionAsync();
			onModelChange(providerId, modelId);
			onClose();
		},
		[onModelChange, onClose],
	);

	const toggleProvider = useCallback((providerId: string) => {
		setExpandedProvider((prev) => (prev === providerId ? null : providerId));
	}, []);

	const getModelDisplayName = (model: Model) => {
		const name = model.name || model.id;
		return name.length > 40 ? `${name.substring(0, 37)}...` : name;
	};

	return (
		<Modal
			visible={visible}
			animationType="slide"
			presentationStyle="pageSheet"
			onRequestClose={onClose}
		>
			<View
				style={[
					styles.modalContainer,
					{
						backgroundColor: colors.background,
						paddingTop: insets.top,
					},
				]}
			>
				<View
					style={[styles.modalHeader, { borderBottomColor: colors.border }]}
				>
					<Text style={[typography.uiHeader, { color: colors.foreground }]}>
						Select Model
					</Text>
					<Pressable
						onPress={onClose}
						style={[styles.closeButton, { backgroundColor: colors.muted }]}
					>
						<Text style={[typography.uiLabel, { color: colors.foreground }]}>
							Done
						</Text>
					</Pressable>
				</View>

				{/* Search Input */}
				<View style={[styles.searchContainer, { borderBottomColor: colors.border }]}>
					<View style={[styles.searchInputWrapper, { backgroundColor: colors.muted }]}>
						<SearchIcon color={colors.mutedForeground} size={16} />
						<TextInput
							style={[styles.searchInput, { color: colors.foreground }]}
							placeholder="Search models..."
							placeholderTextColor={colors.mutedForeground}
							value={searchQuery}
							onChangeText={setSearchQuery}
							autoCapitalize="none"
							autoCorrect={false}
						/>
						{searchQuery.length > 0 && (
							<Pressable onPress={() => setSearchQuery("")}>
								<ClearIcon color={colors.mutedForeground} size={16} />
							</Pressable>
						)}
					</View>
				</View>

				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
					keyboardShouldPersistTaps="handled"
				>
					{/* Search Results */}
					{isSearching ? (
						filteredModels.length === 0 ? (
								<View style={styles.emptyState}>
									<Text style={[typography.body, { color: colors.mutedForeground }]}>
										No models found for "{searchQuery}"
									</Text>
								</View>
							) : (
								<View style={[styles.searchResults, { borderColor: colors.border }]}>
									{filteredModels.map((model) => {
										const isSelected =
											model.providerId === currentProviderId &&
											model.modelId === currentModelId;

										return (
											<Pressable
												key={`${model.providerId}-${model.modelId}`}
												onPress={() =>
													handleModelSelect(model.providerId, model.modelId)
												}
												style={[
													styles.searchResultItem,
													{
														backgroundColor: isSelected
															? `${colors.primary}15`
															: "transparent",
													},
												]}
											>
												<View style={styles.searchResultInfo}>
													<Text
														style={[
															typography.body,
															{
																color: isSelected
																	? colors.primary
																	: colors.foreground,
															},
														]}
														numberOfLines={1}
													>
														{model.modelName.length > 40
															? `${model.modelName.substring(0, 37)}...`
															: model.modelName}
													</Text>
													<Text
														style={[
															typography.micro,
															{ color: colors.mutedForeground },
														]}
													>
														{model.providerName}
													</Text>
												</View>
												{isSelected && (
													<CheckIcon size={16} color={colors.primary} />
												)}
											</Pressable>
										);
									})}
							</View>
						)
					) : (
						/* Provider List */
						availableProviders.map((provider) => {
						const isExpanded = expandedProvider === provider.id;
						const isCurrentProvider = provider.id === currentProviderId;

						return (
							<View key={provider.id} style={styles.providerSection}>
								<Pressable
									onPress={() => toggleProvider(provider.id)}
									style={[
										styles.providerHeader,
										{
											backgroundColor: isCurrentProvider
												? `${colors.primary}10`
												: colors.card,
											borderColor: isCurrentProvider
												? colors.primary
												: colors.border,
										},
									]}
								>
									<View style={styles.providerInfo}>
										<View style={styles.providerTitle}>
											<ProviderLogo providerId={provider.id} />
											<Text
												style={[
													typography.uiLabel,
													{ color: colors.foreground, fontWeight: "600" },
												]}
											>
												{provider.name}
											</Text>
										</View>
										<Text
											style={[
												typography.micro,
												{ color: colors.mutedForeground },
											]}
										>
											{(provider.models?.length ?? 0)} model{(provider.models?.length ?? 0) !== 1 ? 's' : ''}
										</Text>
									</View>
									<ChevronDownIcon
										size={16}
										color={colors.mutedForeground}
										style={{
											transform: [{ rotate: isExpanded ? "180deg" : "0deg" }],
										}}
									/>
								</Pressable>

								{isExpanded && provider.models && provider.models.length > 0 && (
									<View
										style={[styles.modelList, { borderColor: colors.border }]}
									>
										{provider.models.map((model) => {
											const isSelected =
												provider.id === currentProviderId &&
												model.id === currentModelId;

											return (
												<Pressable
													key={model.id}
													onPress={() =>
														handleModelSelect(provider.id, model.id)
													}
													style={[
														styles.modelItem,
														{
															backgroundColor: isSelected
																? `${colors.primary}15`
																: "transparent",
														},
													]}
												>
													<Text
														style={[
															typography.body,
															{
																color: isSelected
																	? colors.primary
																	: colors.foreground,
															},
														]}
														numberOfLines={1}
													>
														{getModelDisplayName(model)}
													</Text>
													{isSelected && (
														<CheckIcon size={16} color={colors.primary} />
													)}
												</Pressable>
											);
										})}
									</View>
								)}
							</View>
						);
					})
					)}
				</ScrollView>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	modalContainer: {
		flex: 1,
	},
	modalHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		borderBottomWidth: 1,
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	closeButton: {
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		padding: 16,
	},
	providerSection: {
		marginBottom: 12,
	},
	providerHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		padding: 12,
		borderRadius: 12,
		borderWidth: 1,
	},
	providerInfo: {
		flex: 1,
	},
	providerTitle: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginBottom: 2,
	},
	providerLogo: {
		width: 22,
		height: 22,
		borderRadius: 4,
		alignItems: "center",
		justifyContent: "center",
	},
	modelList: {
		marginTop: 4,
		borderRadius: 12,
		borderWidth: 1,
		overflow: "hidden",
	},
	modelItem: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 12,
		paddingVertical: 10,
	},
	searchContainer: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
	},
	searchInputWrapper: {
		flexDirection: "row",
		alignItems: "center",
		borderRadius: 12,
		paddingHorizontal: 12,
		paddingVertical: 10,
		gap: 8,
	},
	searchInput: {
		flex: 1,
		fontSize: 14,
		padding: 0,
	},
	emptyState: {
		paddingVertical: 32,
		alignItems: "center",
	},
	searchResults: {
		borderRadius: 12,
		borderWidth: 1,
		overflow: "hidden",
	},
	searchResultItem: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 12,
		paddingVertical: 10,
	},
	searchResultInfo: {
		flex: 1,
		marginRight: 8,
	},
});
