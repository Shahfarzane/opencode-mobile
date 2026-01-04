import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { providersApi, type Provider } from "@/api";
import { useTheme, typography } from "@/theme";
import { SettingsListItem } from "./SettingsListItem";
import { KeyIcon } from "@/components/icons";

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

	const loadProviders = useCallback(async () => {
		setIsLoading(true);
		try {
			const data = await providersApi.list();
			setProviders(data);
		} catch (error) {
			console.error("Failed to load providers:", error);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadProviders();
	}, [loadProviders]);

	if (isLoading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color={colors.primary} />
			</View>
		);
	}

	return (
		<ScrollView style={styles.container}>
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
