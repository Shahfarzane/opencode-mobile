import { useCallback, useState } from "react";
import {
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckIcon, ChevronDownIcon } from "@/components/icons";
import { fontStyle, typography, useTheme } from "@/theme";

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
				style={[
					styles.button,
					{
						backgroundColor: colors.muted,
						borderColor: colors.border,
						opacity: disabled ? 0.5 : 1,
					},
				]}
			>
				<Text
					style={[
						typography.micro,
						styles.buttonText,
						{ color: colors.foreground },
					]}
					numberOfLines={1}
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
							onPress={() => setShowPicker(false)}
							style={[styles.closeButton, { backgroundColor: colors.muted }]}
						>
							<Text style={[typography.uiLabel, { color: colors.foreground }]}>
								Done
							</Text>
						</Pressable>
					</View>

					<ScrollView
						style={styles.scrollView}
						contentContainerStyle={styles.scrollContent}
					>
						{providers.map((provider) => {
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
						})}
					</ScrollView>
				</View>
			</Modal>
		</>
	);
}

const styles = StyleSheet.create({
	button: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 6,
		borderWidth: 0,
	},
	buttonText: {
		maxWidth: 140,
	},
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
});
