import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	Pressable,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type Provider, providersApi } from "@/api";
import { ChevronLeft, LayersIcon, PlusIcon } from "@/components/icons";
import { SettingsListItem } from "@/components/settings";
import { IconButton, ProviderLogo } from "@/components/ui";
import { Fonts, FontSizes, Spacing, useTheme } from "@/theme";

export default function ProvidersListScreen() {
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();
	const [providers, setProviders] = useState<Provider[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isRefreshing, setIsRefreshing] = useState(false);

	const loadProviders = useCallback(async (showRefresh = false) => {
		if (showRefresh) {
			setIsRefreshing(true);
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		} else {
			setIsLoading(true);
		}
		try {
			// Use listConnected() to get only authenticated providers
			const data = await providersApi.listConnected();
			setProviders(data);
		} catch (error) {
			console.error("Failed to load providers:", error);
		} finally {
			setIsLoading(false);
			setIsRefreshing(false);
		}
	}, []);

	useEffect(() => {
		loadProviders(false);
	}, [loadProviders]);

	const handleRefresh = useCallback(() => {
		loadProviders(true);
	}, [loadProviders]);

	const handleSelectProvider = (providerId: string) => {
		router.push(`/settings/providers/${encodeURIComponent(providerId)}`);
	};

	const handleAddProvider = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		router.push("/settings/providers/add");
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
					Providers
				</Text>
				<IconButton
					icon={<PlusIcon size={16} color={colors.mutedForeground} />}
					variant="ghost"
					size="icon-sm"
					accessibilityLabel="Add new provider"
					onPress={handleAddProvider}
				/>
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
					refreshControl={
						<RefreshControl
							refreshing={isRefreshing}
							onRefresh={handleRefresh}
							tintColor={colors.primary}
						/>
					}
				>
					{/* Total count header - matches desktop */}
					<View
						style={[
							styles.countHeader,
							{ borderBottomColor: colors.border },
						]}
					>
						<Text style={[styles.countText, { color: colors.mutedForeground }]}>
							Total {providers.length}
						</Text>
					</View>

					{providers.length > 0 && (
						<View style={styles.section}>
							{providers.map((provider) => {
								const modelCount = provider.models?.length || 0;
								return (
									<SettingsListItem
										key={provider.id}
										title={provider.name || provider.id}
										leftIcon={<ProviderLogo providerId={provider.id} size={16} />}
										rightContent={
											<Text
												style={[
													styles.modelCount,
													{ color: `${colors.mutedForeground}99` },
												]}
											>
												{modelCount}
											</Text>
										}
										onPress={() => handleSelectProvider(provider.id)}
									/>
								);
							})}
						</View>
					)}

					{providers.length === 0 && (
						<View style={styles.emptyContainer}>
							<LayersIcon size={40} color={colors.mutedForeground} style={{ opacity: 0.5 }} />
							<Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>
								No providers found
							</Text>
							<Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
								Check your OpenCode configuration
							</Text>
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
		paddingTop: 0,
	},
	countHeader: {
		paddingHorizontal: Spacing[4],
		paddingVertical: Spacing[3],
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	countText: {
		fontSize: FontSizes.meta,
		fontFamily: Fonts.regular,
	},
	section: {
		paddingTop: Spacing[2],
		paddingBottom: Spacing[1],
	},
	modelCount: {
		fontSize: FontSizes.micro,
		fontFamily: Fonts.regular,
	},
	emptyContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 48,
		paddingHorizontal: Spacing[4],
		gap: 8,
	},
	emptyTitle: {
		fontSize: FontSizes.uiLabel,
		fontFamily: Fonts.medium,
		marginTop: Spacing[3],
	},
	emptySubtitle: {
		fontSize: FontSizes.meta,
		fontFamily: Fonts.regular,
		opacity: 0.75,
	},
});
