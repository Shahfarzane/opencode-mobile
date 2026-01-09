import { useCallback, useState } from "react";
import {
	Modal,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckIcon, ChevronDownIcon } from "@/components/icons";
import { fontStyle, typography, useTheme } from "@/theme";
import { withOpacity, OPACITY } from "@/utils/colors";

interface Provider {
	id: string;
	name: string;
	models: Array<{
		id: string;
		name: string;
	}>;
}

interface ModelControlsProps {
	providers: Provider[];
	currentProviderId?: string;
	currentModelId?: string;
	onProviderChange?: (providerId: string) => void;
	onModelChange?: (providerId: string, modelId: string) => void;
	disabled?: boolean;
}

export function ModelControls({
	providers,
	currentProviderId,
	currentModelId,
	onProviderChange,
	onModelChange,
	disabled = false,
}: ModelControlsProps) {
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();
	const [showPicker, setShowPicker] = useState(false);
	const [expandedProvider, setExpandedProvider] = useState<string | null>(
		currentProviderId || null,
	);

	const currentProvider = providers.find((p) => p.id === currentProviderId);
	const currentModel = currentProvider?.models.find(
		(m) => m.id === currentModelId,
	);

	if (__DEV__) {
		console.log("[ModelControls] State:", {
			providersCount: providers.length,
			currentProviderId,
			currentModelId,
			currentProviderFound: !!currentProvider,
			currentProviderModels: currentProvider?.models?.length,
			currentModelFound: !!currentModel,
			currentModelData: currentModel
				? { id: currentModel.id, name: currentModel.name }
				: null,
		});
	}

	const getModelDisplayName = (
		model: { id: string; name: string } | undefined,
	) => {
		const name = model?.name || model?.id || "";
		if (__DEV__) {
			console.log("[ModelControls] getModelDisplayName:", {
				modelName: model?.name,
				modelId: model?.id,
				result: name,
			});
		}
		return name.length > 40 ? `${name.substring(0, 37)}...` : name;
	};

	const displayText =
		getModelDisplayName(currentModel) ||
		currentProvider?.name ||
		"Select model";

	if (__DEV__) {
		console.log("[ModelControls] displayText:", displayText);
	}

	const handleModelSelect = useCallback(
		(providerId: string, modelId: string) => {
			if (providerId !== currentProviderId) {
				onProviderChange?.(providerId);
			}
			onModelChange?.(providerId, modelId);
			setShowPicker(false);
		},
		[currentProviderId, onProviderChange, onModelChange],
	);

	const toggleProvider = useCallback((providerId: string) => {
		setExpandedProvider((prev) => (prev === providerId ? null : providerId));
	}, []);

	return (
		<>
			<Pressable
				onPress={() => !disabled && setShowPicker(true)}
				disabled={disabled}
				className="flex-row items-center gap-1.5 px-2 py-1 rounded-md"
				style={{
					backgroundColor: colors.muted,
					borderColor: colors.border,
					opacity: disabled ? 0.5 : 1,
				}}
			>
				<Text
					style={[typography.micro, { color: colors.foreground, maxWidth: 200, flexShrink: 1 }]}
					numberOfLines={1}
					ellipsizeMode="tail"
				>
					{displayText}
				</Text>
				<ChevronDownIcon size={14} color={colors.mutedForeground} />
			</Pressable>

			<Modal
				visible={showPicker}
				animationType="slide"
				presentationStyle="pageSheet"
				onRequestClose={() => setShowPicker(false)}
			>
				<View
					className="flex-1"
					style={{ backgroundColor: colors.background, paddingTop: insets.top }}
				>
					<View
						className="flex-row items-center justify-between border-b px-4 py-3"
						style={{ borderBottomColor: colors.border }}
					>
						<Text style={[typography.uiHeader, { color: colors.foreground }]}>
							Select Model
						</Text>
						<Pressable
							onPress={() => setShowPicker(false)}
							className="rounded-lg px-3 py-2"
							style={{ backgroundColor: colors.muted }}
						>
							<Text style={[typography.uiLabel, { color: colors.foreground }]}>
								Done
							</Text>
						</Pressable>
					</View>

					<ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
						{providers.map((provider) => {
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
											<Text
												style={[
													typography.uiLabel,
													fontStyle("600"),
													{ color: colors.foreground },
												]}
											>
												{provider.name}
											</Text>
											<Text
												style={[
													typography.micro,
													{ color: colors.mutedForeground },
												]}
											>
												{provider.models.length} models
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

									{isExpanded && (
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
						})}
					</ScrollView>
				</View>
			</Modal>
		</>
	);
}
