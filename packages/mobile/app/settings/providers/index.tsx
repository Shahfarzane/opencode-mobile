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
import { ChevronLeft, KeyIcon } from "@/components/icons";
import { SettingsListItem } from "@/components/settings";
import { Fonts, typography, Spacing, useTheme } from "@/theme";

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
			const data = await providersApi.list();
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
					refreshControl={
						<RefreshControl
							refreshing={isRefreshing}
							onRefresh={handleRefresh}
							tintColor={colors.primary}
						/>
					}
				>
					<View style={styles.section}>
						<Text
							style={[
								styles.sectionTitle,
								{ color: colors.mutedForeground },
							]}
						>
							{providers.length} PROVIDER{providers.length !== 1 ? "S" : ""}
						</Text>
						{providers.map((provider) => (
							<SettingsListItem
								key={provider.id}
								title={provider.name}
								subtitle={`${provider.models?.length || 0} models`}
								onPress={() => handleSelectProvider(provider.id)}
								icon={<KeyIcon color={colors.primary} size={18} />}
							/>
						))}
					</View>

					{providers.length === 0 && (
						<View style={styles.emptyContainer}>
							<KeyIcon color={colors.mutedForeground} size={40} />
							<Text style={[typography.uiLabel, { color: colors.mutedForeground }]}>
								No providers configured
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
		paddingTop: Spacing[4],
	},
	section: {
		marginBottom: Spacing[4],
	},
	sectionTitle: {
		fontSize: 12,
		fontFamily: Fonts.semiBold,
		letterSpacing: 0.5,
		paddingHorizontal: Spacing[4],
		marginBottom: Spacing[2],
	},
	emptyContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 48,
		gap: 12,
	},
});
