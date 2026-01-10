import BottomSheet, {
	BottomSheetBackdrop,
	type BottomSheetBackdropProps,
	BottomSheetScrollView,
	BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	Pressable,
	Text,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckIcon, SearchIcon, StarIcon, XIcon } from "@/components/icons";
import { ProviderLogo } from "@/components/ui/ProviderLogo";
import { Radius, Spacing, fontStyle, typography, useTheme } from "@/theme";
import { withOpacity, OPACITY } from "@/utils/colors";

interface Model {
	id: string;
	name: string;
	contextLength?: number;
	outputLength?: number;
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
		return formatted.endsWith(".0") ? `${Math.floor(value / 1000000)}M` : `${formatted}M`;
	}
	if (value >= 1000) {
		const formatted = (value / 1000).toFixed(1);
		return formatted.endsWith(".0") ? `${Math.floor(value / 1000)}K` : `${formatted}K`;
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
		if (normalizedId.includes("google") || normalizedId.includes("gemini")) return "G";
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
		<Text style={[typography.micro, fontStyle("600"), { color: colors.foreground }]}>
			{getProviderSymbol(providerId)}
		</Text>
	);
}

/**
 * Provider logo with fallback to text symbol
 */
function ProviderLogoWithFallback({ providerId, size = 16 }: { providerId: string; size?: number }) {
	const { colors } = useTheme();
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
 * Section header component (Provider name with logo)
 */
function SectionHeader({
	providerId,
	providerName
}: {
	providerId: string;
	providerName: string;
}) {
	const { colors } = useTheme();

	return (
		<View
			className="flex-row items-center gap-2 px-3 py-2"
			style={{ backgroundColor: colors.background }}
		>
			<ProviderLogoWithFallback providerId={providerId} size={20} />
			<Text style={[typography.body, fontStyle("600"), { color: colors.primary }]}>
				{providerName}
			</Text>
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
}: {
	model: Model;
	providerId: string;
	isSelected: boolean;
	isFavorite: boolean;
	onSelect: () => void;
	onToggleFavorite?: () => void;
}) {
	const { colors } = useTheme();
	const displayName = model.name || model.id;
	const truncatedName = displayName.length > 28 ? `${displayName.substring(0, 25)}...` : displayName;
	const contextStr = formatContextLength(model.contextLength);

	return (
		<Pressable
			onPress={onSelect}
			className="flex-row items-center py-2.5 px-3"
			style={({ pressed }) => ({
				backgroundColor: pressed
					? colors.muted
					: isSelected
						? withOpacity(colors.primary, OPACITY.light)
						: "transparent",
			})}
		>
			{/* Model name */}
			<View className="flex-1 flex-row items-center">
				<Text
					style={[
						typography.body,
						fontStyle("500"),
						{ color: isSelected ? colors.primary : colors.foreground, flexShrink: 1 },
					]}
					numberOfLines={1}
				>
					{truncatedName}
				</Text>
			</View>

			{/* Right side: context, checkmark and favorite */}
			<View className="flex-row items-center gap-3">
				{contextStr ? (
					<View
						style={{
							backgroundColor: withOpacity(colors.mutedForeground, 0.15),
							paddingHorizontal: 6,
							paddingVertical: 2,
							borderRadius: Radius.sm,
						}}
					>
						<Text style={[typography.micro, fontStyle("500"), { color: colors.mutedForeground }]}>
							{contextStr}
						</Text>
					</View>
				) : null}
				{isSelected && <CheckIcon size={16} color={colors.primary} />}
				<Pressable
					onPress={(e) => {
						e.stopPropagation();
						onToggleFavorite?.();
					}}
					hitSlop={8}
					style={{ padding: 4 }}
				>
					<StarIcon
						size={16}
						color={isFavorite ? "#EAB308" : colors.mutedForeground}
						fill={isFavorite ? "#EAB308" : "transparent"}
					/>
				</Pressable>
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
}: ModelPickerProps) {
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();
	const bottomSheetRef = useRef<BottomSheet>(null);
	const snapPoints = useMemo(() => ["70%", "90%"], []);
	const [searchQuery, setSearchQuery] = useState("");

	// Handle visibility changes
	useEffect(() => {
		if (visible) {
			bottomSheetRef.current?.snapToIndex(0);
		} else {
			bottomSheetRef.current?.close();
		}
	}, [visible]);

	// Filter to only show providers that are enabled and have models
	const availableProviders = useMemo(() =>
		providers.filter(
			(provider) => provider.enabled && provider.models && provider.models.length > 0,
		),
	[providers]);

	// Helper to check if model is favorite
	const isFavorite = useCallback((provId: string, modId: string) => {
		return favoriteModels.has(`${provId}/${modId}`);
	}, [favoriteModels]);

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
		const favorites: { providerId: string; providerName: string; model: Model }[] = [];
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
			return modelName.includes(query) || providerName.toLowerCase().includes(query);
		});
	}, [favoriteModelsList, searchQuery]);

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

	const renderBackdrop = useCallback(
		(props: BottomSheetBackdropProps) => (
			<BottomSheetBackdrop
				{...props}
				disappearsOnIndex={-1}
				appearsOnIndex={0}
				opacity={0.5}
				pressBehavior="close"
			/>
		),
		[],
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
		bottomSheetRef.current?.close();
		onClose();
	}, [onClose]);

	const isSearching = searchQuery.trim().length > 0;
	const hasResults = filteredProviders.length > 0 || filteredFavorites.length > 0;

	return (
		<BottomSheet
			ref={bottomSheetRef}
			index={-1}
			snapPoints={snapPoints}
			enablePanDownToClose
			backdropComponent={renderBackdrop}
			onChange={handleSheetChange}
			backgroundStyle={{ backgroundColor: colors.background }}
			handleIndicatorStyle={{ backgroundColor: colors.mutedForeground, width: 36 }}
			keyboardBehavior="interactive"
			keyboardBlurBehavior="restore"
		>
			{/* Header */}
			<View className="px-4 pb-3 flex-row items-center justify-between">
				<Text style={[typography.uiHeader, fontStyle("600"), { color: colors.foreground }]}>
					Select Model
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
					<BottomSheetTextInput
						value={searchQuery}
						onChangeText={setSearchQuery}
						placeholder="Search models"
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

			<BottomSheetScrollView
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
					<>
						{/* Favorites Section */}
						{filteredFavorites.length > 0 && (
							<>
								<View className="flex-row items-center gap-2 px-3 py-2">
									<StarIcon size={14} color={colors.primary} fill={colors.primary} />
									<Text style={[typography.uiLabel, fontStyle("600"), { color: colors.foreground }]}>
										Favorites
									</Text>
								</View>
								{filteredFavorites.map(({ providerId, model }) => {
									const isSelected = providerId === currentProviderId && model.id === currentModelId;
									return (
										<ModelRow
											key={`fav-${providerId}-${model.id}`}
											model={model}
											providerId={providerId}
											isSelected={isSelected}
											isFavorite={true}
											onSelect={() => handleModelSelect(providerId, model.id)}
											onToggleFavorite={onToggleFavorite ? () => handleToggleFavorite(providerId, model.id) : undefined}
										/>
									);
								})}
								<Separator />
							</>
						)}

						{/* Provider Sections */}
						{filteredProviders.map((provider, providerIndex) => (
							<View key={provider.id}>
								{providerIndex > 0 && <Separator />}
								<SectionHeader
									providerId={provider.id}
									providerName={provider.name}
								/>
								{provider.models?.map((model) => {
									const isSelected = provider.id === currentProviderId && model.id === currentModelId;
									const modelIsFavorite = isFavorite(provider.id, model.id);
									return (
										<ModelRow
											key={`${provider.id}-${model.id}`}
											model={model}
											providerId={provider.id}
											isSelected={isSelected}
											isFavorite={modelIsFavorite}
											onSelect={() => handleModelSelect(provider.id, model.id)}
											onToggleFavorite={onToggleFavorite ? () => handleToggleFavorite(provider.id, model.id) : undefined}
										/>
									);
								})}
							</View>
						))}
					</>
				)}
			</BottomSheetScrollView>
		</BottomSheet>
	);
}
