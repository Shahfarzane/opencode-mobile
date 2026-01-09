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
import { type GitIdentityProfile, gitApi } from "@/api";
import { ChevronLeft, PlusIcon } from "@/components/icons";
import { SettingsListItem } from "@/components/settings";
import { Button, IconButton } from "@/components/ui";
import { Fonts, Spacing, typography, useTheme } from "@/theme";

export default function GitIdentitiesListScreen() {
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();
	const [profiles, setProfiles] = useState<GitIdentityProfile[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isRefreshing, setIsRefreshing] = useState(false);

	const loadProfiles = useCallback(async (showRefresh = false) => {
		if (showRefresh) {
			setIsRefreshing(true);
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		} else {
			setIsLoading(true);
		}
		try {
			const data = await gitApi.getIdentities();
			setProfiles(data);
		} catch (error) {
			console.error("Failed to load git identities:", error);
		} finally {
			setIsLoading(false);
			setIsRefreshing(false);
		}
	}, []);

	useEffect(() => {
		loadProfiles(false);
	}, [loadProfiles]);

	const handleRefresh = useCallback(() => {
		loadProfiles(true);
	}, [loadProfiles]);

	const handleSelectProfile = (profileId: string) => {
		router.push(`/settings/git/${encodeURIComponent(profileId)}`);
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
					Git Identities
				</Text>
				<IconButton
					icon={<PlusIcon size={14} color={colors.primaryForeground} />}
					variant="primary"
					size="icon-sm"
					accessibilityLabel="Add new git identity"
					onPress={() => handleSelectProfile("__new__")}
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
					{profiles.length > 0 && (
						<View style={styles.section}>
							<Text
								style={[styles.sectionTitle, { color: colors.mutedForeground }]}
							>
								{profiles.length} IDENTIT{profiles.length !== 1 ? "IES" : "Y"}
							</Text>
							{profiles.map((profile) => (
								<SettingsListItem
									key={profile.id}
									title={profile.name}
									subtitle={profile.userEmail}
									onPress={() => handleSelectProfile(profile.id)}
								/>
							))}
						</View>
					)}

					{profiles.length === 0 && (
						<View style={styles.emptyContainer}>
							<Text
								style={[typography.uiLabel, { color: colors.mutedForeground }]}
							>
								No git identities yet
							</Text>
							<Button
								variant="primary"
								size="sm"
								onPress={() => handleSelectProfile("__new__")}
							>
								<PlusIcon size={16} color={colors.primaryForeground} />
								<Button.Label>Create your first identity</Button.Label>
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
