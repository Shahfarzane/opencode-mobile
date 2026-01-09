import * as Haptics from "expo-haptics";
import { useCallback, useMemo, useState } from "react";
import {
	Modal,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { SearchInput } from "@/components/ui";
import { fontStyle, typography, useTheme } from "@/theme";
import { withOpacity, OPACITY } from "@/utils/colors";

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
		<View
			className="w-[22px] h-[22px] rounded items-center justify-center"
			style={{ backgroundColor: colors.muted }}
		>
			<Text style={[typography.micro, fontStyle("600"), { color: colors.foreground }]}>
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
				className="flex-1"
				style={{
					backgroundColor: colors.background,
					paddingTop: insets.top,
				}}
			>
				<View
					className="flex-row items-center justify-between px-4 py-3 border-b"
					style={{ borderBottomColor: colors.border }}
				>
					<Text style={[typography.uiHeader, { color: colors.foreground }]}>
						Select Model
					</Text>
					<Pressable
						onPress={onClose}
						className="rounded-lg px-3 py-2"
						style={{ backgroundColor: colors.muted }}
					>
						<Text style={[typography.uiLabel, { color: colors.foreground }]}>
							Done
						</Text>
					</Pressable>
				</View>

				{/* Search Input */}
				<View
					className="px-4 py-3 border-b"
					style={{ borderBottomColor: colors.border }}
				>
					<SearchInput
						value={searchQuery}
						onChangeText={setSearchQuery}
						placeholder="Search models..."
					/>
				</View>

				<ScrollView
					className="flex-1"
					contentContainerStyle={{ padding: 16 }}
					keyboardShouldPersistTaps="handled"
				>
					{/* Search Results */}
					{isSearching ? (
						filteredModels.length === 0 ? (
							<View className="py-8 items-center">
								<Text style={[typography.body, { color: colors.mutedForeground }]}>
									No models found for "{searchQuery}"
								</Text>
							</View>
						) : (
							<View
								className="rounded-xl border overflow-hidden"
								style={{ borderColor: colors.border }}
							>
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
											className="flex-row items-center justify-between px-3 py-2.5"
											style={{
												backgroundColor: isSelected
													? withOpacity(colors.primary, OPACITY.active)
													: "transparent",
											}}
										>
											<View className="flex-1 mr-2">
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
								<View key={provider.id} className="mb-3">
									<Pressable
										onPress={() => toggleProvider(provider.id)}
										className="flex-row items-center justify-between p-3 rounded-xl border"
										style={{
											backgroundColor: isCurrentProvider
												? withOpacity(colors.primary, OPACITY.selected)
												: colors.card,
											borderColor: isCurrentProvider
												? colors.primary
												: colors.border,
										}}
									>
										<View className="flex-1">
											<View className="flex-row items-center gap-2 mb-0.5">
												<ProviderLogo providerId={provider.id} />
												<Text
													style={[
														typography.uiLabel,
														fontStyle("600"),
														{ color: colors.foreground },
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
											className="mt-1 rounded-xl border overflow-hidden"
											style={{ borderColor: colors.border }}
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
														className="flex-row items-center justify-between px-3 py-2.5"
														style={{
															backgroundColor: isSelected
																? withOpacity(colors.primary, OPACITY.active)
																: "transparent",
														}}
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


