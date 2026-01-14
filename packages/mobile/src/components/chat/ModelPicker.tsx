import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	Animated,
	Dimensions,
	Keyboard,
	Modal,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	View,
} from "react-native";
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
import { fontStyle, Radius, Spacing, typography, useTheme } from "@/theme";
import { OPACITY, withOpacity } from "@/utils/colors";
import type { ModelButtonPosition } from "./ChatInput";

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
	/** Position of the anchor button to position dropdown from */
	anchorPosition?: ModelButtonPosition;
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
			style={({ pressed }) => ({
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "space-between",
				paddingHorizontal: Spacing[3],
				paddingVertical: Spacing[2],
				opacity: pressed ? 0.7 : 1,
			})}
		>
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					gap: Spacing[2],
					flex: 1,
					minWidth: 0,
				}}
			>
				<ProviderLogoWithFallback providerId={providerId} size={14} />
				<Text
					style={[
						typography.body,
						fontStyle("500"),
						{ color: colors.foreground, flexShrink: 1 },
					]}
					numberOfLines={1}
				>
					{providerName}
				</Text>
				{isCurrent && (
					<Text style={[typography.micro, { color: colors.primary, flexShrink: 0 }]}>
						Current
					</Text>
				)}
			</View>
			<View style={{ flexShrink: 0, marginLeft: Spacing[2] }}>
				{isExpanded ? (
					<ChevronDownIcon size={12} color={colors.mutedForeground} />
				) : (
					<ChevronRightIcon size={12} color={colors.mutedForeground} />
				)}
			</View>
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
		<View style={{ flexDirection: "row", alignItems: "center", gap: Spacing[1] }}>
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
			style={({ pressed }) => ({
				flexDirection: "row",
				alignItems: "center",
				paddingVertical: Spacing[2],
				paddingHorizontal: Spacing[3],
				backgroundColor: isSelected
					? withOpacity(colors.primary, OPACITY.light)
					: "transparent",
				opacity: pressed ? 0.7 : 1,
			})}
		>
			{/* Left: Provider icon (optional) + Model name */}
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					gap: Spacing[1.5],
					flex: 1,
					minWidth: 0,
				}}
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
			<View style={{ flexDirection: "row", alignItems: "center", gap: Spacing[1.5] }}>
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
						onPress={onToggleFavorite}
						hitSlop={8}
						style={({ pressed }) => ({
							width: 28,
							height: 28,
							alignItems: "center",
							justifyContent: "center",
							opacity: pressed ? 0.7 : 1,
						})}
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

const DROPDOWN_MAX_HEIGHT = 400;
const DROPDOWN_MIN_WIDTH = 280;

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
	anchorPosition,
}: ModelPickerProps) {
	const { colors, isDark } = useTheme();
	const insets = useSafeAreaInsets();
	const [searchQuery, setSearchQuery] = useState("");
	const [expandedProviders, setExpandedProviders] = useState<Set<string>>(
		new Set(),
	);
	const searchInputRef = useRef<TextInput>(null);

	// Animation
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const scaleAnim = useRef(new Animated.Value(0.95)).current;

	// Handle visibility changes and animations
	useEffect(() => {
		if (visible) {
			Keyboard.dismiss();
			Animated.parallel([
				Animated.timing(fadeAnim, {
					toValue: 1,
					duration: 150,
					useNativeDriver: true,
				}),
				Animated.spring(scaleAnim, {
					toValue: 1,
					friction: 8,
					tension: 100,
					useNativeDriver: true,
				}),
			]).start(() => {
				// Focus search input after animation
				setTimeout(() => searchInputRef.current?.focus(), 100);
			});
		} else {
			fadeAnim.setValue(0);
			scaleAnim.setValue(0.95);
			setSearchQuery("");
		}
	}, [visible, fadeAnim, scaleAnim]);

	// Calculate dropdown position and width - positioned from top, grows downward
	const dropdownLayout = useMemo(() => {
		const screenWidth = Dimensions.get("window").width;

		if (!anchorPosition) {
			// Default to top-center if no anchor
			const width = Math.max(DROPDOWN_MIN_WIDTH, screenWidth - Spacing[4] * 2);
			return {
				top: insets.top + Spacing[2],
				left: (screenWidth - width) / 2,
				width,
			};
		}

		// Use container width if available, otherwise use minimum
		const width = anchorPosition.containerWidth > 0
			? anchorPosition.containerWidth
			: Math.max(DROPDOWN_MIN_WIDTH, screenWidth - Spacing[4] * 2);

		// Position aligned with the container
		const left = anchorPosition.containerX > 0
			? anchorPosition.containerX
			: Spacing[2];

		// Position from top, below safe area
		const top = insets.top + Spacing[2];

		return { top, left, width };
	}, [anchorPosition, insets.top]);

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
			onClose();
		},
		[onModelChange, onClose],
	);

	const handleToggleFavorite = useCallback(
		(providerId: string, modelId: string) => {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			onToggleFavorite?.(providerId, modelId);
		},
		[onToggleFavorite],
	);

	const handleClose = useCallback(() => {
		onClose();
	}, [onClose]);

	const isSearching = searchQuery.trim().length > 0;
	const hasResults =
		filteredProviders.length > 0 ||
		filteredFavorites.length > 0 ||
		filteredRecents.length > 0;

	if (!visible) {
		return null;
	}

	return (
		<Modal
			visible={visible}
			transparent
			animationType="none"
			onRequestClose={handleClose}
			statusBarTranslucent
		>
			{/* Backdrop */}
			<Pressable
				style={{
					flex: 1,
					backgroundColor: withOpacity("#000000", OPACITY.scrim),
				}}
				onPress={handleClose}
			>
				{/* Dropdown container - positioned from top, grows downward */}
				<Animated.View
					style={{
						position: "absolute",
						top: dropdownLayout.top,
						left: dropdownLayout.left,
						width: dropdownLayout.width,
						maxHeight: DROPDOWN_MAX_HEIGHT,
						backgroundColor: colors.background,
						borderRadius: Radius.xl,
						borderWidth: 1,
						borderColor: colors.border,
						shadowColor: isDark ? "#000" : "#000",
						shadowOffset: { width: 0, height: 8 },
						shadowOpacity: isDark ? 0.4 : 0.15,
						shadowRadius: 24,
						elevation: 10,
						opacity: fadeAnim,
						transform: [{ scale: scaleAnim }],
						overflow: "hidden",
					}}
				>
					<Pressable>
						{/* Header */}
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
								justifyContent: "space-between",
								paddingHorizontal: Spacing[4],
								paddingTop: Spacing[3],
								paddingBottom: Spacing[2],
							}}
						>
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
									opacity: pressed ? 0.7 : 1,
								})}
							>
								<XIcon size={18} color={colors.mutedForeground} />
							</Pressable>
						</View>

						{/* Search Input */}
						<View style={{ paddingHorizontal: Spacing[4], paddingBottom: Spacing[2] }}>
							<View
								style={{
									flexDirection: "row",
									alignItems: "center",
									paddingHorizontal: Spacing[3],
									height: 36,
									borderRadius: Radius.lg,
									backgroundColor: colors.muted,
								}}
							>
								<SearchIcon size={14} color={colors.mutedForeground} />
								<TextInput
									ref={searchInputRef}
									value={searchQuery}
									onChangeText={setSearchQuery}
									placeholder="Search models..."
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
									<Pressable
										onPress={() => setSearchQuery("")}
										hitSlop={8}
										style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
									>
										<XIcon size={14} color={colors.mutedForeground} />
									</Pressable>
								)}
							</View>
						</View>

						{/* Content */}
						<ScrollView
							style={{ maxHeight: DROPDOWN_MAX_HEIGHT - 100 }}
							contentContainerStyle={{ paddingBottom: Spacing[2] }}
							keyboardShouldPersistTaps="handled"
							showsVerticalScrollIndicator={false}
						>
							{!hasResults && isSearching ? (
								<View style={{ paddingVertical: Spacing[6], alignItems: "center" }}>
									<Text style={[typography.body, { color: colors.mutedForeground }]}>
										No models found
									</Text>
								</View>
							) : (
								<View>
									{/* Recent Section */}
									{filteredRecents.length > 0 && (
										<View style={{ marginBottom: Spacing[2] }}>
											<View
												style={{
													flexDirection: "row",
													alignItems: "center",
													gap: Spacing[2],
													paddingHorizontal: Spacing[3],
													paddingVertical: Spacing[1.5],
												}}
											>
												<ClockIcon size={12} color={colors.mutedForeground} />
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
										<View style={{ marginBottom: Spacing[2] }}>
											<View
												style={{
													flexDirection: "row",
													alignItems: "center",
													gap: Spacing[2],
													paddingHorizontal: Spacing[3],
													paddingVertical: Spacing[1.5],
												}}
											>
												<StarIcon
													size={12}
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
													<View style={{ paddingLeft: Spacing[2] }}>
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
						</ScrollView>
					</Pressable>
				</Animated.View>
			</Pressable>
		</Modal>
	);
}
