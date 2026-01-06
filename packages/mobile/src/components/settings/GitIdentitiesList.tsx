import {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useState,
} from "react";
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { type GitIdentityProfile, gitApi } from "@/api";
import { PlusIcon, UsersIcon } from "@/components/icons";
import { typography, useTheme } from "@/theme";
import { SettingsListItem } from "./SettingsListItem";

export interface GitIdentitiesListRef {
	refresh: () => Promise<void>;
}

interface GitIdentitiesListProps {
	selectedProfile?: string | null;
	onSelectProfile: (profileId: string) => void;
}

export const GitIdentitiesList = forwardRef<GitIdentitiesListRef, GitIdentitiesListProps>(
	function GitIdentitiesList({ selectedProfile, onSelectProfile }, ref) {
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

		useImperativeHandle(ref, () => ({
			refresh: loadProfiles,
		}), [loadProfiles]);

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
				<Pressable
					onPress={() => onSelectProfile("__new__")}
					style={[styles.addButton, { backgroundColor: colors.primary }]}
				>
					<PlusIcon size={14} color={colors.background} />
					<Text style={[typography.micro, { color: colors.background, fontWeight: "600" }]}>
						Add
					</Text>
				</Pressable>
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
	},
);

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
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
	},
	addButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 6,
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
