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
import { type Command, commandsApi, isCommandBuiltIn } from "@/api";
import { ChevronLeft, PlusIcon } from "@/components/icons";
import { SettingsListItem } from "@/components/settings";
import { Button, IconButton } from "@/components/ui";
import { Fonts, Spacing, typography, useTheme } from "@/theme";

export default function CommandsListScreen() {
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();
	const [commands, setCommands] = useState<Command[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isRefreshing, setIsRefreshing] = useState(false);

	const loadCommands = useCallback(async (showRefresh = false) => {
		if (showRefresh) {
			setIsRefreshing(true);
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		} else {
			setIsLoading(true);
		}
		try {
			const data = await commandsApi.list();
			setCommands(data.filter((c) => !c.hidden));
		} catch (error) {
			console.error("Failed to load commands:", error);
		} finally {
			setIsLoading(false);
			setIsRefreshing(false);
		}
	}, []);

	useEffect(() => {
		loadCommands(false);
	}, [loadCommands]);

	const handleRefresh = useCallback(() => {
		loadCommands(true);
	}, [loadCommands]);

	const handleSelectCommand = (commandName: string) => {
		router.push(`/settings/commands/${encodeURIComponent(commandName)}`);
	};

	const builtInCommands = commands.filter(isCommandBuiltIn);
	const customCommands = commands.filter((c) => !isCommandBuiltIn(c));

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
					Commands
				</Text>
				<IconButton
					icon={<PlusIcon size={14} color={colors.primaryForeground} />}
					variant="primary"
					size="icon-sm"
					accessibilityLabel="Add new command"
					onPress={() => handleSelectCommand("__new__")}
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
					{builtInCommands.length > 0 && (
						<View style={styles.section}>
							<Text
								style={[styles.sectionTitle, { color: colors.mutedForeground }]}
							>
								BUILT-IN COMMANDS
							</Text>
							{builtInCommands.map((command) => (
								<SettingsListItem
									key={command.name}
									title={`/${command.name}`}
									subtitle={command.description}
									onPress={() => handleSelectCommand(command.name)}
								/>
							))}
						</View>
					)}

					{customCommands.length > 0 && (
						<View style={styles.section}>
							<Text
								style={[styles.sectionTitle, { color: colors.mutedForeground }]}
							>
								CUSTOM COMMANDS
							</Text>
							{customCommands.map((command) => (
								<SettingsListItem
									key={command.name}
									title={`/${command.name}`}
									subtitle={command.description}
									onPress={() => handleSelectCommand(command.name)}
								/>
							))}
						</View>
					)}

					{commands.length === 0 && (
						<View style={styles.emptyContainer}>
							<Text
								style={[typography.uiLabel, { color: colors.mutedForeground }]}
							>
								No commands yet
							</Text>
							<Button
								variant="primary"
								size="sm"
								onPress={() => handleSelectCommand("__new__")}
							>
								<PlusIcon size={16} color={colors.primaryForeground} />
								<Button.Label>Create your first command</Button.Label>
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
