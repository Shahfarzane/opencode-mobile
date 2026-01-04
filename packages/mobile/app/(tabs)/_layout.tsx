import { useState, useCallback } from "react";
import { View, Text, useColorScheme } from "react-native";
import { router } from "expo-router";
import { Header } from "../../src/components/layout/Header";

type MainTab = 'chat' | 'diff' | 'terminal' | 'git';

function PlaceholderScreen({ title }: { title: string }) {
	const colorScheme = useColorScheme();
	const isDark = colorScheme === "dark";
	
	const colors = {
		background: isDark ? "#100F0F" : "#FFFCF0",
		foreground: isDark ? "#CECDC3" : "#100F0F",
		mutedForeground: isDark ? "#878580" : "#6F6E69",
	};

	return (
		<View 
			style={{ 
				flex: 1, 
				alignItems: 'center', 
				justifyContent: 'center',
				backgroundColor: colors.background,
				gap: 8,
			}}
		>
			<Text style={{ fontFamily: 'IBMPlexMono-SemiBold', fontSize: 18, color: colors.foreground }}>
				{title}
			</Text>
			<Text style={{ fontFamily: 'IBMPlexMono-Regular', fontSize: 14, color: colors.mutedForeground }}>
				Coming soon
			</Text>
		</View>
	);
}

export default function TabsLayout() {
	const colorScheme = useColorScheme();
	const isDark = colorScheme === "dark";
	const [activeTab, setActiveTab] = useState<MainTab>('chat');
	const [showSettings, setShowSettings] = useState(false);

	const colors = {
		background: isDark ? "#100F0F" : "#FFFCF0",
	};

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

	const ChatScreen = require("./chat").default;
	const SettingsScreen = require("./settings").default;
	const GitScreen = require("./git").default;

	const renderContent = () => {
		if (showSettings) {
			return <SettingsScreen />;
		}

		switch (activeTab) {
			case 'chat':
				return <ChatScreen />;
			case 'git':
				return <GitScreen />;
			case 'diff':
				return <PlaceholderScreen title="Diff View" />;
			case 'terminal':
				return <PlaceholderScreen title="Terminal" />;
			default:
				return <ChatScreen />;
		}
	};

	return (
		<View style={{ flex: 1, backgroundColor: colors.background }}>
			<Header
				activeTab={activeTab}
				onTabChange={handleTabChange}
				onMenuPress={handleMenuPress}
				onSettingsPress={handleSettingsPress}
			/>
			<View style={{ flex: 1 }}>
				{renderContent()}
			</View>
		</View>
	);
}
