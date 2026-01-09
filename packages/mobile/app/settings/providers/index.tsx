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
import { ChevronLeft, PlusIcon } from "@/components/icons";
import { SettingsListItem } from "@/components/settings";
import { Button, IconButton } from "@/components/ui";
import { Fonts, Spacing, typography, useTheme } from "@/theme";

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
					icon={<PlusIcon size={14} color={colors.primaryForeground} />}
					variant="primary"
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
					{providers.length > 0 && (
						<View style={styles.section}>
							<Text
								style={[styles.sectionTitle, { color: colors.mutedForeground }]}
							>
								{providers.length} PROVIDER{providers.length !== 1 ? "S" : ""}
							</Text>
							{providers.map((provider) => (
								<SettingsListItem
									key={provider.id}
									title={provider.name}
									subtitle={`${provider.models?.length || 0} models`}
									onPress={() => handleSelectProvider(provider.id)}
								/>
							))}
						</View>
					)}

					{providers.length === 0 && (
						<View style={styles.emptyContainer}>
							<Text
								style={[typography.uiLabel, { color: colors.mutedForeground }]}
							>
								No providers connected
							</Text>
							<Text
								style={[
									typography.meta,
									{ color: colors.mutedForeground, textAlign: "center", marginTop: 8 },
								]}
							>
								Add a provider to start using AI models
							</Text>
							<Button
								variant="primary"
								size="sm"
								onPress={handleAddProvider}
							>
								<PlusIcon size={16} color={colors.primaryForeground} />
								<Button.Label>Add Provider</Button.Label>
							</Button>
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
		paddingTop: Spacing[4],
	},
	section: {
		marginBottom: Spacing[5],
	},
	sectionTitle: {
		fontSize: 13,
		fontFamily: Fonts.medium,
		letterSpacing: 0.5,
		marginBottom: Spacing[1],
		paddingHorizontal: Spacing[4],
	},
	emptyContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 48,
		gap: 12,
	},
});
