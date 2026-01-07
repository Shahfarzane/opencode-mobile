import { Pressable, View } from "react-native";
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
import { headerStyles } from "./Header.styles";

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
			className={headerStyles.container({})}
			style={{
				backgroundColor: colors.background,
				borderBottomColor: colors.border,
				borderBottomWidth: 1,
				paddingTop: insets.top,
			}}
		>
			<View className={headerStyles.content({})}>
				{/* Left section: Sessions button + context usage */}
				<View className={headerStyles.leftSection({})}>
					<Pressable
						onPress={onSessionsPress || onMenuPress}
						className={headerStyles.iconButton({})}
						hitSlop={8}
					>
						<PlaylistAddIcon color={colors.mutedForeground} size={20} />
					</Pressable>
					{showContextUsage && (
						<ContextUsageDisplay usage={contextUsage} size="compact" />
					)}
				</View>

				{/* Right section: Tabs + settings */}
				<View className={headerStyles.rightSection({})}>
					{tabs.map((tab) => {
						const isActive = activeTab === tab.id;
						const showDiffDot = tab.id === "diff" && diffFileCount > 0;
						return (
							<Pressable
								key={tab.id}
								onPress={() => onTabChange(tab.id)}
								className={headerStyles.iconButton({})}
								hitSlop={4}
							>
								<View className={headerStyles.tabContent({})}>
									{getTabIcon(
										tab.id,
										isActive ? colors.foreground : colors.mutedForeground,
										20,
									)}
									{/* Dot indicator for diff tab when there are changes */}
									{showDiffDot && (
										<View
											className={headerStyles.changeDot({})}
											style={{ backgroundColor: colors.primary }}
										/>
									)}
								</View>
							</Pressable>
						);
					})}

					<Pressable
						onPress={onSettingsPress}
						className={headerStyles.iconButton({})}
						hitSlop={4}
					>
						<View className={headerStyles.tabContent({})}>
							<SettingsIcon color={colors.mutedForeground} size={20} />
							{hasUpdate && (
								<View
									className={headerStyles.updateDot({})}
									style={{ backgroundColor: colors.primary }}
								/>
							)}
						</View>
					</Pressable>
				</View>
			</View>
		</View>
	);
}

export default Header;
