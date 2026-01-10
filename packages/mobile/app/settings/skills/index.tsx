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
import { type Skill, skillsApi, isSkillBuiltIn, isSkillHidden } from "@/api";
import { BulbIcon, ChevronLeft, PlusIcon } from "@/components/icons";
import { SettingsListItem } from "@/components/settings";
import { IconButton } from "@/components/ui";
import { Fonts, FontSizes, Spacing, useTheme } from "@/theme";

export default function SkillsListScreen() {
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();
	const [skills, setSkills] = useState<Skill[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isRefreshing, setIsRefreshing] = useState(false);

	const loadSkills = useCallback(async (showRefresh = false) => {
		if (showRefresh) {
			setIsRefreshing(true);
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		} else {
			setIsLoading(true);
		}
		try {
			const data = await skillsApi.list();
			setSkills(data.filter((s) => !isSkillHidden(s)));
		} catch (error) {
			console.error("Failed to load skills:", error);
		} finally {
			setIsLoading(false);
			setIsRefreshing(false);
		}
	}, []);

	useEffect(() => {
		loadSkills(false);
	}, [loadSkills]);

	const handleRefresh = useCallback(() => {
		loadSkills(true);
	}, [loadSkills]);

	const handleSelectSkill = (skillName: string) => {
		router.push(`/settings/skills/${encodeURIComponent(skillName)}`);
	};

	const builtInSkills = skills.filter(isSkillBuiltIn);
	const customSkills = skills.filter((s) => !isSkillBuiltIn(s));

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
					Skills
				</Text>
				<IconButton
					icon={<PlusIcon size={16} color={colors.mutedForeground} />}
					variant="ghost"
					size="icon-sm"
					accessibilityLabel="Add new skill"
					onPress={() => handleSelectSkill("__new__")}
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
							Total {skills.length}
						</Text>
					</View>

					{builtInSkills.length > 0 && (
						<View style={styles.section}>
							<Text
								style={[styles.sectionTitle, { color: colors.mutedForeground }]}
							>
								Built-in Skills
							</Text>
							{builtInSkills.map((skill) => (
								<SettingsListItem
									key={skill.name}
									title={skill.name}
									subtitle={skill.description}
									badge="system"
									onPress={() => handleSelectSkill(skill.name)}
								/>
							))}
						</View>
					)}

					{customSkills.length > 0 && (
						<View style={styles.section}>
							<Text
								style={[styles.sectionTitle, { color: colors.mutedForeground }]}
							>
								Custom Skills
							</Text>
							{customSkills.map((skill) => (
								<SettingsListItem
									key={skill.name}
									title={skill.name}
									subtitle={skill.description}
									badge={skill.scope}
									onPress={() => handleSelectSkill(skill.name)}
								/>
							))}
						</View>
					)}

					{skills.length === 0 && (
						<View style={styles.emptyContainer}>
							<BulbIcon size={40} color={colors.mutedForeground} style={{ opacity: 0.5 }} />
							<Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>
								No skills configured
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
		fontSize: FontSizes.h2,
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
	sectionTitle: {
		fontSize: FontSizes.micro,
		fontFamily: Fonts.semiBold,
		letterSpacing: 0.5,
		textTransform: "uppercase",
		marginBottom: Spacing[1.5],
		paddingHorizontal: Spacing[4],
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
