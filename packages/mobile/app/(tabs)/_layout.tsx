import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { gitApi } from "../../src/api";
import type { ContextUsage } from "../../src/components/chat";
import { Header } from "../../src/components/layout/Header";
import { useConnectionStore } from "../../src/stores/useConnectionStore";
import { typography, useTheme } from "../../src/theme";
import ChatScreen from "./chat";
import { ContextUsageContext, SessionSheetContext } from "./_context";
import DiffScreen from "./diff";
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
	const { isConnected, directory } = useConnectionStore();
	const [activeTab, setActiveTab] = useState<MainTab>("chat");
	const [showSettings, setShowSettings] = useState(false);
	const [contextUsage, setContextUsage] = useState<ContextUsage | null>(null);
	const [diffFileCount, setDiffFileCount] = useState(0);
	const openSessionSheetRef = useRef<() => void>(() => {});

	// Fetch git status to show file count indicator on git tab
	useEffect(() => {
		if (!isConnected || !directory) {
			setDiffFileCount(0);
			return;
		}

		const fetchGitStatus = async () => {
			try {
				const status = await gitApi.getStatus();
				setDiffFileCount(status?.files?.length ?? 0);
			} catch {
				setDiffFileCount(0);
			}
		};

		fetchGitStatus();
		// Poll for changes every 10 seconds
		const interval = setInterval(fetchGitStatus, 10000);
		return () => clearInterval(interval);
	}, [isConnected, directory]);

	const handleMenuPress = useCallback(() => {
		router.push("/onboarding/directory");
	}, []);

	const handleSettingsPress = useCallback(() => {
		setShowSettings(true);
	}, []);

	const handleSessionsPress = useCallback(() => {
		openSessionSheetRef.current();
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

	const sessionSheetValue = useMemo(
		() => ({
			openSessionSheet: () => openSessionSheetRef.current(),
			setOpenSessionSheet: (fn: () => void) => {
				openSessionSheetRef.current = fn;
			},
		}),
		[],
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
				return <DiffScreen />;
			case "terminal":
				return <TerminalScreen />;
			default:
				return <ChatScreen />;
		}
	};

	return (
		<SessionSheetContext.Provider value={sessionSheetValue}>
			<ContextUsageContext.Provider value={contextUsageValue}>
				<View style={[styles.container, { backgroundColor: colors.background }]}>
					<Header
						activeTab={activeTab}
						onTabChange={handleTabChange}
						onMenuPress={handleMenuPress}
						onSettingsPress={handleSettingsPress}
						onSessionsPress={activeTab === "chat" ? handleSessionsPress : undefined}
						contextUsage={contextUsage}
						diffFileCount={diffFileCount}
					/>
					<View style={styles.content}>{renderContent()}</View>
				</View>
			</ContextUsageContext.Provider>
		</SessionSheetContext.Provider>
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
