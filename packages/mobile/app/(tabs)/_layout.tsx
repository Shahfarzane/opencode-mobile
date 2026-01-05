import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { ContextUsage } from "../../src/components/chat";
import { Header } from "../../src/components/layout/Header";
import { typography, useTheme } from "../../src/theme";
import ChatScreen from "./chat";
import { ContextUsageContext } from "./context";
import GitScreen from "./git";
import SettingsScreen from "./settings";
import TerminalScreen from "./terminal";

type MainTab = "chat" | "diff" | "terminal" | "git";

function PlaceholderScreen({ title }: { title: string }) {
	const { colors } = useTheme();

	return (
		<View style={[styles.placeholder, { backgroundColor: colors.background }]}>
			<Text style={[typography.uiHeader, { color: colors.foreground }]}>
				{title}
			</Text>
			<Text style={[typography.uiLabel, { color: colors.mutedForeground }]}>
				Coming soon
			</Text>
		</View>
	);
}

export default function TabsLayout() {
	const { colors } = useTheme();
	const [activeTab, setActiveTab] = useState<MainTab>("chat");
	const [showSettings, setShowSettings] = useState(false);
	const [contextUsage, setContextUsage] = useState<ContextUsage | null>(null);

	const handleMenuPress = useCallback(() => {
		router.push("/onboarding/directory");
	}, []);

	const handleSettingsPress = useCallback(() => {
		setShowSettings(true);
	}, []);

	const handleTabChange = useCallback((tab: MainTab) => {
		setActiveTab(tab);
		setShowSettings(false);
	}, []);

	const contextUsageValue = useMemo(
		() => ({
			contextUsage,
			setContextUsage,
		}),
		[contextUsage],
	);

	const renderContent = () => {
		if (showSettings) {
			return <SettingsScreen />;
		}

		switch (activeTab) {
			case "chat":
				return <ChatScreen />;
			case "git":
				return <GitScreen />;
			case "diff":
				return <PlaceholderScreen title="Diff View" />;
			case "terminal":
				return <TerminalScreen />;
			default:
				return <ChatScreen />;
		}
	};

	return (
		<ContextUsageContext.Provider value={contextUsageValue}>
			<View style={[styles.container, { backgroundColor: colors.background }]}>
				<Header
					activeTab={activeTab}
					onTabChange={handleTabChange}
					onMenuPress={handleMenuPress}
					onSettingsPress={handleSettingsPress}
					contextUsage={contextUsage}
				/>
				<View style={styles.content}>{renderContent()}</View>
			</View>
		</ContextUsageContext.Provider>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
	},
	placeholder: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
	},
});
