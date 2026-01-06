import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { type Provider, providersApi } from "@/api";
import { KeyIcon } from "@/components/icons";
import { typography, useTheme } from "@/theme";
import { SettingsListItem } from "./SettingsListItem";

interface ProvidersListProps {
	selectedProvider?: string | null;
	onSelectProvider: (providerId: string) => void;
}

export function ProvidersList({
	selectedProvider,
	onSelectProvider,
}: ProvidersListProps) {
	const { colors } = useTheme();
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

	if (isLoading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color={colors.primary} />
			</View>
		);
	}

	return (
		<ScrollView
			style={styles.container}
			refreshControl={
				<RefreshControl
					refreshing={isRefreshing}
					onRefresh={handleRefresh}
					tintColor={colors.primary}
				/>
			}
		>
			<View style={[styles.header, { borderBottomColor: colors.border }]}>
				<Text style={[typography.meta, { color: colors.mutedForeground }]}>
					Total {providers.length}
				</Text>
			</View>

			<View style={styles.section}>
				{providers.map((provider) => (
					<SettingsListItem
						key={provider.id}
						title={provider.name || provider.id}
						subtitle={`${provider.models?.length || 0} models`}
						badge={provider.enabled ? "Enabled" : undefined}
						isSelected={selectedProvider === provider.id}
						onPress={() => onSelectProvider(provider.id)}
						icon={<KeyIcon color={colors.primary} size={18} />}
					/>
				))}
			</View>

			{providers.length === 0 && (
				<View style={styles.emptyContainer}>
					<KeyIcon color={colors.mutedForeground} size={40} />
					<Text style={[typography.uiLabel, { color: colors.mutedForeground }]}>
						No providers available
					</Text>
					<Text style={[typography.meta, { color: colors.mutedForeground, textAlign: "center" }]}>
						Configure providers in your OpenCode settings
					</Text>
				</View>
			)}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	loadingContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	header: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
	},
	section: {
		paddingTop: 12,
	},
	emptyContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 48,
		gap: 12,
	},
});
