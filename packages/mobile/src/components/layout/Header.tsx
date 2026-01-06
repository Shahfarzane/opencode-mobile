import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type ContextUsage, ContextUsageDisplay } from "@/components/chat";
import {
	ChatIcon,
	CodeIcon,
	GitBranchIcon,
	MenuIcon,
	SettingsIcon,
	SidebarIcon,
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
				<View style={styles.leftSection}>
					{/* Always show sidebar button - use onSessionsPress on chat tab, onMenuPress otherwise */}
					<Pressable
						onPress={onSessionsPress || onMenuPress}
						style={styles.menuButton}
						hitSlop={8}
					>
						<SidebarIcon color={colors.mutedForeground} size={20} />
					</Pressable>
					{showContextUsage && (
						<ContextUsageDisplay usage={contextUsage} size="compact" />
					)}
				</View>

				<View style={styles.tabsSection}>
					{tabs.map((tab) => {
						const isActive = activeTab === tab.id;
						const showGitDot = tab.id === "git" && diffFileCount > 0;
						return (
							<Pressable
								key={tab.id}
								onPress={() => onTabChange(tab.id)}
								style={styles.tabButton}
								hitSlop={4}
							>
								<View style={styles.tabContent}>
									{getTabIcon(
										tab.id,
										isActive ? colors.foreground : colors.mutedForeground,
										20,
									)}
									{isActive && (
										<View
											style={[
												styles.activeIndicator,
												{ backgroundColor: colors.foreground },
											]}
										/>
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
						style={styles.settingsButton}
						hitSlop={4}
					>
						<SettingsIcon color={colors.mutedForeground} size={20} />
						{hasUpdate && (
							<View
								style={[styles.updateDot, { backgroundColor: colors.primary }]}
							/>
						)}
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
		height: 52,
	},
	leftSection: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	menuButton: {
		padding: 8,
		marginLeft: -8,
	},
	tabsSection: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	tabButton: {
		padding: 10,
	},
	tabContent: {
		position: "relative",
	},
	activeIndicator: {
		position: "absolute",
		bottom: -10,
		left: 0,
		right: 0,
		height: 2,
		borderRadius: 1,
	},
	settingsButton: {
		padding: 10,
		position: "relative",
	},
	updateDot: {
		position: "absolute",
		top: 6,
		right: 6,
		width: 8,
		height: 8,
		borderRadius: 4,
	},
	changeDot: {
		position: "absolute",
		top: 2,
		right: 2,
		width: 8,
		height: 8,
		borderRadius: 4,
	},
});

export default Header;
