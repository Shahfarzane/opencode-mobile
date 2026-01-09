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
import { ChevronLeft, GitBranchIcon, PlusIcon } from "@/components/icons";
import { SettingsListItem } from "@/components/settings";
import { IconButton } from "@/components/ui";
import { Fonts, FontSizes, Spacing, useTheme } from "@/theme";

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
					icon={<PlusIcon size={16} color={colors.mutedForeground} />}
					variant="ghost"
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
					{/* Total count header - matches desktop */}
					<View
						style={[
							styles.countHeader,
							{ borderBottomColor: colors.border },
						]}
					>
						<Text style={[styles.countText, { color: colors.mutedForeground }]}>
							Total {profiles.length}
						</Text>
					</View>

					{profiles.length > 0 && (
						<View style={styles.section}>
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
							<GitBranchIcon size={40} color={colors.mutedForeground} style={{ opacity: 0.5 }} />
							<Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>
								No git identities configured
							</Text>
							<Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
								Use the + button above to create one
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
