import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type ContextUsage, ContextUsageDisplay } from "@/components/chat";
import {
	ChatIcon,
	CodeIcon,
	GitBranchIcon,
	PlaylistAddIcon,
	SettingsIcon,
	TerminalIcon,
} from "@/components/icons";
import { useTheme } from "@/theme";

type MainTab = "chat" | "diff" | "terminal" | "git";

interface TabConfig {
	id: MainTab;
	label: string;
}

const tabs: TabConfig[] = [
	{ id: "chat", label: "Chat" },
	{ id: "diff", label: "Diff" },
	{ id: "terminal", label: "Terminal" },
	{ id: "git", label: "Git" },
];

interface HeaderProps {
	activeTab: MainTab;
	onTabChange: (tab: MainTab) => void;
	onMenuPress: () => void;
	onSettingsPress: () => void;
	onSessionsPress?: () => void;
	hasUpdate?: boolean;
	contextUsage?: ContextUsage | null;
	diffFileCount?: number;
}

function getTabIcon(tabId: MainTab, color: string, size: number) {
	switch (tabId) {
		case "chat":
			return <ChatIcon color={color} size={size} />;
		case "diff":
			return <CodeIcon color={color} size={size} />;
		case "terminal":
			return <TerminalIcon color={color} size={size} />;
		case "git":
			return <GitBranchIcon color={color} size={size} />;
	}
}

export function Header({
	activeTab,
	onTabChange,
	onMenuPress,
	onSettingsPress,
	onSessionsPress,
	hasUpdate = false,
	contextUsage,
	diffFileCount = 0,
}: HeaderProps) {
	const insets = useSafeAreaInsets();
	const { colors } = useTheme();

	const showContextUsage =
		activeTab === "chat" && contextUsage && contextUsage.totalTokens > 0;

	return (
		<View
			style={[
				styles.container,
				{
					backgroundColor: colors.background,
					borderBottomColor: colors.border,
					paddingTop: insets.top,
				},
			]}
		>
			<View style={styles.content}>
				{/* Left section: Sessions button + context usage */}
				<View style={styles.leftSection}>
					<Pressable
						onPress={onSessionsPress || onMenuPress}
						style={styles.iconButton}
						hitSlop={8}
					>
						<PlaylistAddIcon color={colors.mutedForeground} size={20} />
					</Pressable>
					{showContextUsage && (
						<ContextUsageDisplay usage={contextUsage} size="compact" />
					)}
				</View>

				{/* Right section: Tabs + settings */}
				<View style={styles.rightSection}>
					{tabs.map((tab) => {
						const isActive = activeTab === tab.id;
						const showGitDot = tab.id === "git" && diffFileCount > 0;
						return (
							<Pressable
								key={tab.id}
								onPress={() => onTabChange(tab.id)}
								style={styles.iconButton}
								hitSlop={4}
							>
								<View style={styles.tabContent}>
									{getTabIcon(
										tab.id,
										isActive ? colors.foreground : colors.mutedForeground,
										20,
									)}
									{/* Orange dot for git tab when there are changes */}
									{showGitDot && (
										<View
											style={[
												styles.changeDot,
												{ backgroundColor: colors.primary },
											]}
										/>
									)}
								</View>
							</Pressable>
						);
					})}

					<Pressable
						onPress={onSettingsPress}
						style={styles.iconButton}
						hitSlop={4}
					>
						<View style={styles.tabContent}>
							<SettingsIcon color={colors.mutedForeground} size={20} />
							{hasUpdate && (
								<View
									style={[styles.updateDot, { backgroundColor: colors.primary }]}
								/>
							)}
						</View>
					</Pressable>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		borderBottomWidth: 1,
	},
	content: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	leftSection: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	rightSection: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	iconButton: {
		width: 36,
		height: 36,
		alignItems: "center",
		justifyContent: "center",
	},
	tabContent: {
		position: "relative",
	},
	updateDot: {
		position: "absolute",
		top: 0,
		right: 0,
		width: 8,
		height: 8,
		borderRadius: 4,
	},
	changeDot: {
		position: "absolute",
		top: 0,
		right: 0,
		width: 8,
		height: 8,
		borderRadius: 4,
	},
});

export default Header;
