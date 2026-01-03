import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

type TabIconProps = {
	color: string;
	size?: number;
};

function ChatIcon({ color, size = 24 }: TabIconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Path
				d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

function GitIcon({ color, size = 24 }: TabIconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Circle cx="12" cy="18" r="3" stroke={color} strokeWidth={2} />
			<Circle cx="6" cy="6" r="3" stroke={color} strokeWidth={2} />
			<Circle cx="18" cy="6" r="3" stroke={color} strokeWidth={2} />
			<Path
				d="M18 9v2a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9"
				stroke={color}
				strokeWidth={2}
			/>
			<Path d="M12 13v2" stroke={color} strokeWidth={2} />
		</Svg>
	);
}

function SettingsIcon({ color, size = 24 }: TabIconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Path
				d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={2} />
		</Svg>
	);
}

export default function TabsLayout() {
	const colorScheme = useColorScheme();
	const isDark = colorScheme === "dark";

	const colors = {
		background: isDark ? "#100F0F" : "#FFFCF0",
		border: isDark ? "#343331" : "#DAD8CE",
		inactive: isDark ? "#878580" : "#6F6E69",
		active: "#EC8B49",
	};

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarStyle: {
					backgroundColor: colors.background,
					borderTopColor: colors.border,
					borderTopWidth: 1,
					height: 84,
					paddingTop: 8,
				},
				tabBarActiveTintColor: colors.active,
				tabBarInactiveTintColor: colors.inactive,
				tabBarLabelStyle: {
					fontFamily: "IBMPlexMono-Medium",
					fontSize: 11,
					marginTop: 4,
				},
			}}
		>
			<Tabs.Screen
				name="chat"
				options={{
					title: "Chat",
					tabBarIcon: ({ color }) => <ChatIcon color={color} />,
				}}
			/>
			<Tabs.Screen
				name="git"
				options={{
					title: "Git",
					tabBarIcon: ({ color }) => <GitIcon color={color} />,
				}}
			/>
			<Tabs.Screen
				name="settings"
				options={{
					title: "Settings",
					tabBarIcon: ({ color }) => <SettingsIcon color={color} />,
				}}
			/>
		</Tabs>
	);
}
