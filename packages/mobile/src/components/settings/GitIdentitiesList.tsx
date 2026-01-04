import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { gitApi, type GitIdentityProfile } from "@/api";
import { useTheme, typography } from "@/theme";
import { SettingsListItem } from "./SettingsListItem";
import { UsersIcon } from "@/components/icons";

interface GitIdentitiesListProps {
	selectedProfile?: string | null;
	onSelectProfile: (profileId: string) => void;
}

export function GitIdentitiesList({
	selectedProfile,
	onSelectProfile,
}: GitIdentitiesListProps) {
	const { colors } = useTheme();
	const [profiles, setProfiles] = useState<GitIdentityProfile[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const loadProfiles = useCallback(async () => {
		setIsLoading(true);
		try {
			const data = await gitApi.getIdentities();
			setProfiles(data);
		} catch (error) {
			console.error("Failed to load git identities:", error);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadProfiles();
	}, [loadProfiles]);

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
					Total {profiles.length}
				</Text>
			</View>

			<View style={styles.section}>
				{profiles.map((profile) => (
					<SettingsListItem
						key={profile.id}
						title={profile.name}
						subtitle={profile.userEmail}
						isSelected={selectedProfile === profile.id}
						onPress={() => onSelectProfile(profile.id)}
						icon={<UsersIcon color={colors.primary} size={18} />}
					/>
				))}
			</View>

			{profiles.length === 0 && (
				<View style={styles.emptyContainer}>
					<UsersIcon color={colors.mutedForeground} size={40} />
					<Text style={[typography.uiLabel, { color: colors.mutedForeground }]}>
						No git identities configured
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
