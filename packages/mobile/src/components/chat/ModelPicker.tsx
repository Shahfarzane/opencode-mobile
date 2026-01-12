import type BottomSheet from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
	BrainIcon,
	ChevronDownIcon,
	ChevronRightIcon,
	ClockIcon,
	ImageIcon,
	SearchIcon,
	StarIcon,
	ToolIcon,
	XIcon,
} from "@/components/icons";
import { ProviderLogo } from "@/components/ui/ProviderLogo";
import { Sheet, SheetScrollView, SheetTextInput } from "@/components/ui/sheet";
import { fontStyle, Radius, Spacing, typography, useTheme } from "@/theme";
import { OPACITY, withOpacity } from "@/utils/colors";

interface ModelMetadata {
	reasoning?: boolean;
	tool_call?: boolean;
	modalities?: {
		input?: string[];
		output?: string[];
	};
}

interface Model {
	id: string;
	name: string;
	contextLength?: number;
	outputLength?: number;
	metadata?: ModelMetadata;
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
	favoriteModels?: Set<string>;
	onToggleFavorite?: (providerId: string, modelId: string) => void;
	recentModels?: Array<{ providerId: string; modelId: string }>;
}

/**
 * Format token count for display (e.g., 200000 -> "200K")
 */
function formatContextLength(value?: number | null): string {
	if (typeof value !== "number" || Number.isNaN(value)) {
		return "";
	}
	if (value === 0) {
		return "0";
	}
	if (value >= 1000000) {
		const formatted = (value / 1000000).toFixed(1);
		return formatted.endsWith(".0")
			? `${Math.floor(value / 1000000)}M`
			: `${formatted}M`;
	}
	if (value >= 1000) {
		const formatted = (value / 1000).toFixed(1);
		return formatted.endsWith(".0")
			? `${Math.floor(value / 1000)}K`
			: `${formatted}K`;
	}
	return String(value);
}

/**
 * Provider symbol fallback when logo fails to load
 */
function ProviderSymbol({ providerId }: { providerId: string }) {
	const { colors } = useTheme();

	const getProviderSymbol = (id: string) => {
		const normalizedId = id.toLowerCase();
		if (normalizedId.includes("anthropic")) return "A\\";
		if (normalizedId.includes("openai")) return "O";
		if (normalizedId.includes("google") || normalizedId.includes("gemini"))
			return "G";
		if (normalizedId.includes("mistral")) return "M";
		if (normalizedId.includes("groq")) return "Gr";
		if (normalizedId.includes("ollama")) return "Ol";
		if (normalizedId.includes("openrouter")) return "OR";
		if (normalizedId.includes("deepseek")) return "DS";
		if (normalizedId.includes("xai")) return "X";
		if (normalizedId.includes("cohere")) return "Co";
		if (normalizedId.includes("perplexity")) return "P";
		if (normalizedId.includes("nebius")) return "N";
		if (normalizedId.includes("github")) return "GH";
		return id.charAt(0).toUpperCase();
	};

	return (
		<Text
			style={[typography.micro, fontStyle("600"), { color: colors.foreground }]}
		>
			{getProviderSymbol(providerId)}
		</Text>
	);
}

/**
 * Provider logo with fallback to text symbol
 */
function ProviderLogoWithFallback({
	providerId,
	size = 16,
}: {
	providerId: string;
	size?: number;
}) {
	const [showFallback, setShowFallback] = useState(false);

	if (showFallback || !providerId) {
		return (
			<View
				style={{
					width: size,
					height: size,
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<ProviderSymbol providerId={providerId} />
			</View>
		);
	}

	return (
		<ProviderLogo
			providerId={providerId}
			size={size}
			onError={() => setShowFallback(true)}
		/>
	);
}

/**
 * Collapsible provider header component (Provider name with logo, Current tag, and arrow)
 */
function ProviderHeader({
	providerId,
	providerName,
	isExpanded,
	isCurrent,
	onPress,
}: {
	providerId: string;
	providerName: string;
	isExpanded: boolean;
	isCurrent: boolean;
	onPress: () => void;
}) {
	const { colors } = useTheme();

	return (
		<Pressable
			onPress={onPress}
			className="flex-row items-center justify-between px-3 py-2"
			style={({ pressed }) => ({
				backgroundColor: pressed
					? withOpacity(colors.muted, 0.5)
					: "transparent",
			})}
		>
			<View className="flex-row items-center gap-2 flex-1">
				<ProviderLogoWithFallback providerId={providerId} size={14} />
				<Text
					style={[
						typography.body,
						fontStyle("500"),
						{ color: colors.foreground },
					]}
				>
					{providerName}
				</Text>
				{isCurrent && (
					<Text style={[typography.micro, { color: colors.primary }]}>
						Current
					</Text>
				)}
			</View>
			{isExpanded ? (
				<ChevronDownIcon size={12} color={colors.mutedForeground} />
			) : (
				<ChevronRightIcon size={12} color={colors.mutedForeground} />
			)}
		</Pressable>
	);
}

/**
 * Capability icons component for model features
 */
function CapabilityIcons({ model }: { model: Model }) {
	const { colors } = useTheme();
	const metadata = model.metadata;
	const icons: Array<{ key: string; Icon: typeof BrainIcon; label: string }> =
		[];

	// Check for reasoning capability
	if (metadata?.reasoning) {
		icons.push({ key: "reasoning", Icon: BrainIcon, label: "Reasoning" });
	}

	// Check for tool calling capability
	if (metadata?.tool_call) {
		icons.push({ key: "tool_call", Icon: ToolIcon, label: "Tool calling" });
	}

	// Check for image input modality (vision)
	if (metadata?.modalities?.input?.includes("image")) {
		icons.push({ key: "vision", Icon: ImageIcon, label: "Vision" });
	}

	if (icons.length === 0) return null;

	return (
		<View className="flex-row items-center gap-1">
			{icons.map(({ key, Icon }) => (
				<Icon key={key} size={12} color={colors.mutedForeground} />
			))}
		</View>
	);
}

/**
 * Single model row component
 */
function ModelRow({
	model,
	providerId,
	isSelected,
	isFavorite,
	onSelect,
	onToggleFavorite,
	showProviderIcon = false,
}: {
	model: Model;
	providerId: string;
	isSelected: boolean;
	isFavorite: boolean;
	onSelect: () => void;
	onToggleFavorite?: () => void;
	showProviderIcon?: boolean;
}) {
	const { colors } = useTheme();
	const displayName = model.name || model.id;
	const truncatedName =
		displayName.length > 24
			? `${displayName.substring(0, 21)}...`
			: displayName;
	const contextStr = formatContextLength(model.contextLength);
	const outputStr = formatContextLength(model.outputLength);
	// Format as "XXX ctx • XXX out" like PWA
	const contextDisplay =
		contextStr && outputStr
			? `${contextStr} ctx • ${outputStr} out`
			: contextStr
				? `${contextStr} ctx`
				: outputStr
					? `${outputStr} out`
					: "";

	return (
		<Pressable
			onPress={onSelect}
			className="flex-row items-center py-2 px-3"
			style={({ pressed }) => ({
				backgroundColor: pressed
					? colors.muted
					: isSelected
						? withOpacity(colors.primary, OPACITY.light)
						: "transparent",
			})}
		>
			{/* Left: Provider icon (optional) + Model name */}
			<View
				className="flex-row items-center gap-1.5 min-w-0"
				style={{ flex: 1 }}
			>
				{showProviderIcon && (
					<ProviderLogoWithFallback providerId={providerId} size={12} />
				)}
				<Text
					style={[
						typography.body,
						fontStyle("500"),
						{ color: isSelected ? colors.primary : colors.foreground },
					]}
					numberOfLines={1}
				>
					{truncatedName}
				</Text>
			</View>

			{/* Middle: Context info (spaced evenly) */}
			{contextDisplay ? (
				<Text
					style={[
						typography.micro,
						{ color: colors.mutedForeground, marginHorizontal: 8 },
					]}
				>
					{contextDisplay}
				</Text>
			) : null}

			{/* Right side: capability icons, selected indicator, and favorite */}
			<View className="flex-row items-center gap-1.5">
				<CapabilityIcons model={model} />
				{isSelected && (
					<View
						style={{
							width: 8,
							height: 8,
							borderRadius: 4,
							backgroundColor: colors.primary,
						}}
					/>
				)}
				{onToggleFavorite && (
					<Pressable
						onPress={(e) => {
							e.stopPropagation();
							onToggleFavorite();
						}}
						hitSlop={8}
						style={{
							width: 28,
							height: 28,
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<StarIcon
							size={14}
							color={isFavorite ? colors.warning : colors.mutedForeground}
							fill={isFavorite ? colors.warning : "transparent"}
						/>
					</Pressable>
				)}
			</View>
		</Pressable>
	);
}

/**
 * Separator line between sections
 */
function Separator() {
	const { colors } = useTheme();
	return (
		<View
			style={{
				height: 1,
				backgroundColor: colors.border,
				marginVertical: Spacing[1],
			}}
		/>
	);
}

export function ModelPicker({
	providers,
	currentProviderId,
	currentModelId,
	onModelChange,
	visible,
	onClose,
	favoriteModels = new Set(),
	onToggleFavorite,
	recentModels = [],
}: ModelPickerProps) {
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();
	const bottomSheetRef = useRef<BottomSheet>(null);
	const snapPoints = useMemo(() => ["70%", "90%"], []);
	const [searchQuery, setSearchQuery] = useState("");
	const [expandedProviders, setExpandedProviders] = useState<Set<string>>(
		new Set(),
	);

	// Handle visibility changes
	useEffect(() => {
		if (visible) {
			bottomSheetRef.current?.snapToIndex(0);
		} else {
			bottomSheetRef.current?.close();
		}
	}, [visible]);

	// Filter to only show providers that are enabled and have models
	const availableProviders = useMemo(
		() =>
			providers.filter(
				(provider) =>
					provider.enabled && provider.models && provider.models.length > 0,
			),
		[providers],
	);

	// Helper to check if model is favorite
	const isFavorite = useCallback(
		(provId: string, modId: string) => {
			return favoriteModels.has(`${provId}/${modId}`);
		},
		[favoriteModels],
	);

	// Filter providers/models based on search query
	const filteredProviders = useMemo(() => {
		const query = searchQuery.toLowerCase().trim();
		if (!query) return availableProviders;

		return availableProviders
			.map((provider) => {
				const filteredModels = provider.models?.filter((model) => {
					const modelName = (model.name || model.id).toLowerCase();
					const providerName = provider.name.toLowerCase();
					return modelName.includes(query) || providerName.includes(query);
				});
				return { ...provider, models: filteredModels };
			})
			.filter((provider) => provider.models && provider.models.length > 0);
	}, [availableProviders, searchQuery]);

	// Get favorite models list
	const favoriteModelsList = useMemo(() => {
		const favorites: {
			providerId: string;
			providerName: string;
			model: Model;
		}[] = [];
		for (const provider of availableProviders) {
			if (provider.models) {
				for (const model of provider.models) {
					if (isFavorite(provider.id, model.id)) {
						favorites.push({
							providerId: provider.id,
							providerName: provider.name,
							model,
						});
					}
				}
			}
		}
		return favorites;
	}, [availableProviders, isFavorite]);

	// Filter favorites by search
	const filteredFavorites = useMemo(() => {
		const query = searchQuery.toLowerCase().trim();
		if (!query) return favoriteModelsList;
		return favoriteModelsList.filter(({ model, providerName }) => {
			const modelName = (model.name || model.id).toLowerCase();
			return (
				modelName.includes(query) || providerName.toLowerCase().includes(query)
			);
		});
	}, [favoriteModelsList, searchQuery]);

	// Get recent models list
	const recentModelsList = useMemo(() => {
		const recents: {
			providerId: string;
			providerName: string;
			model: Model;
		}[] = [];
		for (const recent of recentModels) {
			const provider = availableProviders.find(
				(p) => p.id === recent.providerId,
			);
			if (provider?.models) {
				const model = provider.models.find((m) => m.id === recent.modelId);
				if (model) {
					recents.push({
						providerId: provider.id,
						providerName: provider.name,
						model,
					});
				}
			}
		}
		return recents;
	}, [availableProviders, recentModels]);

	// Filter recents by search
	const filteredRecents = useMemo(() => {
		const query = searchQuery.toLowerCase().trim();
		if (!query) return recentModelsList;
		return recentModelsList.filter(({ model, providerName }) => {
			const modelName = (model.name || model.id).toLowerCase();
			return (
				modelName.includes(query) || providerName.toLowerCase().includes(query)
			);
		});
	}, [recentModelsList, searchQuery]);

	// Toggle provider expansion
	const toggleProviderExpansion = useCallback((providerId: string) => {
		Haptics.selectionAsync();
		setExpandedProviders((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(providerId)) {
				newSet.delete(providerId);
			} else {
				newSet.add(providerId);
			}
			return newSet;
		});
	}, []);

	const handleModelSelect = useCallback(
		(providerId: string, modelId: string) => {
			Haptics.selectionAsync();
			onModelChange(providerId, modelId);
			// Close sheet - onClose will be called by handleSheetChange when sheet reaches -1
			bottomSheetRef.current?.close();
		},
		[onModelChange],
	);

	const handleToggleFavorite = useCallback(
		(providerId: string, modelId: string) => {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			onToggleFavorite?.(providerId, modelId);
		},
		[onToggleFavorite],
	);

	const handleSheetChange = useCallback(
		(index: number) => {
			if (index === -1) {
				onClose();
				setSearchQuery("");
			}
		},
		[onClose],
	);

	const handleClose = useCallback(() => {
		// Only close sheet - onClose will be called by handleSheetChange when sheet reaches -1
		bottomSheetRef.current?.close();
	}, []);

	const isSearching = searchQuery.trim().length > 0;
	const hasResults =
		filteredProviders.length > 0 ||
		filteredFavorites.length > 0 ||
		filteredRecents.length > 0;

	return (
		<Sheet
			ref={bottomSheetRef}
			snapPoints={snapPoints}
			onChange={handleSheetChange}
			contentPadding={16}
		>
			{/* Header */}
			<View className="px-4 pb-3 flex-row items-center justify-between">
				<Text
					style={[
						typography.uiHeader,
						fontStyle("600"),
						{ color: colors.foreground },
					]}
				>
					Select model
				</Text>
				<Pressable
					onPress={handleClose}
					hitSlop={12}
					style={({ pressed }) => ({
						padding: Spacing[1.5],
						borderRadius: Radius.full,
						backgroundColor: pressed ? colors.muted : "transparent",
					})}
				>
					<XIcon size={20} color={colors.mutedForeground} />
				</Pressable>
			</View>

			{/* Search Input */}
			<View className="px-4 pb-3">
				<View
					className="flex-row items-center px-3 h-10 rounded-lg"
					style={{ backgroundColor: colors.muted }}
				>
					<SearchIcon size={16} color={colors.mutedForeground} />
					<SheetTextInput
						value={searchQuery}
						onChangeText={setSearchQuery}
						placeholder="Search providers or models"
						placeholderTextColor={colors.mutedForeground}
						style={[
							typography.body,
							{
								flex: 1,
								marginLeft: Spacing[2],
								color: colors.foreground,
								paddingVertical: 0,
							},
						]}
					/>

					{searchQuery.length > 0 && (
						<Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
							<XIcon size={16} color={colors.mutedForeground} />
						</Pressable>
					)}
				</View>
			</View>

			<SheetScrollView
				contentContainerStyle={{
					paddingBottom: insets.bottom + 16,
				}}
				keyboardShouldPersistTaps="handled"
			>
				{!hasResults && isSearching ? (
					<View className="py-8 items-center">
						<Text style={[typography.body, { color: colors.mutedForeground }]}>
							No models found
						</Text>
					</View>
				) : (
					<View>
						{/* Recent Section */}
						{filteredRecents.length > 0 && (
							<View style={{ marginBottom: 8 }}>
								<View className="flex-row items-center gap-2 px-3 py-1.5">
									<ClockIcon size={14} color={colors.mutedForeground} />
									<Text
										style={[
											typography.micro,
											fontStyle("600"),
											{
												color: colors.mutedForeground,
												textTransform: "uppercase",
												letterSpacing: 0.5,
											},
										]}
									>
										Recent
									</Text>
								</View>
								{filteredRecents.map(({ providerId, model }) => {
									const isSelected =
										providerId === currentProviderId &&
										model.id === currentModelId;
									return (
										<ModelRow
											key={`recent-${providerId}-${model.id}`}
											model={model}
											providerId={providerId}
											isSelected={isSelected}
											isFavorite={isFavorite(providerId, model.id)}
											onSelect={() => handleModelSelect(providerId, model.id)}
											onToggleFavorite={
												onToggleFavorite
													? () => handleToggleFavorite(providerId, model.id)
													: undefined
											}
											showProviderIcon
										/>
									);
								})}
								<Separator />
							</View>
						)}

						{/* Favorites Section */}
						{filteredFavorites.length > 0 && (
							<View style={{ marginBottom: 8 }}>
								<View className="flex-row items-center gap-2 px-3 py-1.5">
									<StarIcon
										size={14}
										color={colors.primary}
										fill={colors.primary}
									/>
									<Text
										style={[
											typography.micro,
											fontStyle("600"),
											{
												color: colors.mutedForeground,
												textTransform: "uppercase",
												letterSpacing: 0.5,
											},
										]}
									>
										Favorites
									</Text>
								</View>
								{filteredFavorites.map(({ providerId, model }) => {
									const isSelected =
										providerId === currentProviderId &&
										model.id === currentModelId;
									return (
										<ModelRow
											key={`fav-${providerId}-${model.id}`}
											model={model}
											providerId={providerId}
											isSelected={isSelected}
											isFavorite={true}
											onSelect={() => handleModelSelect(providerId, model.id)}
											onToggleFavorite={
												onToggleFavorite
													? () => handleToggleFavorite(providerId, model.id)
													: undefined
											}
											showProviderIcon
										/>
									);
								})}
								<Separator />
							</View>
						)}

						{/* Provider Sections (Collapsible) */}
						{filteredProviders.map((provider) => {
							const isExpanded = expandedProviders.has(provider.id);
							const isCurrent = provider.id === currentProviderId;
							return (
								<View key={provider.id}>
									<ProviderHeader
										providerId={provider.id}
										providerName={provider.name}
										isExpanded={isExpanded}
										isCurrent={isCurrent}
										onPress={() => toggleProviderExpansion(provider.id)}
									/>
									{isExpanded && (
										<View style={{ paddingLeft: 8 }}>
											{provider.models?.map((model) => {
												const isSelected =
													provider.id === currentProviderId &&
													model.id === currentModelId;
												const modelIsFavorite = isFavorite(
													provider.id,
													model.id,
												);
												return (
													<ModelRow
														key={`${provider.id}-${model.id}`}
														model={model}
														providerId={provider.id}
														isSelected={isSelected}
														isFavorite={modelIsFavorite}
														onSelect={() =>
															handleModelSelect(provider.id, model.id)
														}
														onToggleFavorite={
															onToggleFavorite
																? () =>
																		handleToggleFavorite(provider.id, model.id)
																: undefined
														}
													/>
												);
											})}
										</View>
									)}
								</View>
							);
						})}
					</View>
				)}
			</SheetScrollView>
		</Sheet>
	);
}
