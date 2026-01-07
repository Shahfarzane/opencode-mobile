import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import {
	SettingsGroup,
	SettingsRow,
	SettingsScreen,
} from "@/components/settings";
import { TrashIcon } from "@/components/icons";
import { settingsApi, type SettingsPayload } from "@/api";
import { useTheme } from "@/theme";

function BrainIcon({ color }: { color: string }) {
	return (
		<Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
			<Path
				d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

function QueueIcon({ color }: { color: string }) {
	return (
		<Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
			<Rect
				x="3"
				y="3"
				width="18"
				height="18"
				rx="2"
				stroke={color}
				strokeWidth={2}
			/>
			<Path
				d="M9 3v18M15 3v18M3 9h18M3 15h18"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
			/>
		</Svg>
	);
}

export default function PreferencesScreen() {
	const { colors } = useTheme();
	const [settings, setSettings] = useState<SettingsPayload | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);

	const loadSettings = useCallback(async () => {
		try {
			const result = await settingsApi.load();
			setSettings(result.settings);
		} catch {
			setSettings(null);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadSettings();
	}, [loadSettings]);

	const handleToggleSetting = async (
		key: keyof SettingsPayload,
		value: boolean
	) => {
		if (isSaving) return;

		setIsSaving(true);
		try {
			const updated = await settingsApi.save({ [key]: value });
			setSettings(updated);
		} catch (err) {
			Alert.alert(
				"Error",
				err instanceof Error ? err.message : "Failed to save setting"
			);
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading) {
		return (
			<SettingsScreen title="Preferences">
				<View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
					<ActivityIndicator size="large" color={colors.primary} />
				</View>
			</SettingsScreen>
		);
	}

	return (
		<SettingsScreen title="Preferences">
			<SettingsGroup
				header="AI Behavior"
				footer="Show the AI's reasoning process in responses."
			>
				<SettingsRow
					icon={<BrainIcon color={colors.primary} />}
					title="Show Reasoning Traces"
					subtitle="Display AI thinking process"
					toggle={settings?.showReasoningTraces ?? true}
					onToggleChange={(value) =>
						handleToggleSetting("showReasoningTraces", value)
					}
				/>
			</SettingsGroup>

			<SettingsGroup
				header="Sessions"
				footer={
					settings?.autoDeleteEnabled
						? `Sessions older than ${settings?.autoDeleteAfterDays ?? 7} days will be automatically deleted.`
						: "Sessions will be kept indefinitely."
				}
			>
				<SettingsRow
					icon={<TrashIcon size={20} color={colors.primary} />}
					title="Auto-delete Sessions"
					subtitle={
						settings?.autoDeleteEnabled
							? `After ${settings?.autoDeleteAfterDays ?? 7} days`
							: "Disabled"
					}
					toggle={settings?.autoDeleteEnabled ?? false}
					onToggleChange={(value) =>
						handleToggleSetting("autoDeleteEnabled", value)
					}
				/>
			</SettingsGroup>

			<SettingsGroup
				header="Message Queue"
				footer="Queue messages to be sent after the current response completes."
			>
				<SettingsRow
					icon={<QueueIcon color={colors.primary} />}
					title="Queue Mode"
					subtitle="Queue messages while processing"
					toggle={settings?.queueModeEnabled ?? false}
					onToggleChange={(value) =>
						handleToggleSetting("queueModeEnabled", value)
					}
				/>
			</SettingsGroup>
		</SettingsScreen>
	);
}
