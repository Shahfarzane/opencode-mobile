import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Pressable,
	StyleSheet,
	Switch,
	Text,
	View,
} from "react-native";
import { SettingsScreen } from "@/components/settings";
import { settingsApi, type SettingsPayload } from "@/api";
import { Fonts, FontSizes, Spacing, useTheme } from "@/theme";

interface ToggleRowProps {
	title: string;
	description?: string;
	value: boolean;
	onValueChange: (value: boolean) => void;
}

function ToggleRow({ title, description, value, onValueChange }: ToggleRowProps) {
	const { colors } = useTheme();

	return (
		<Pressable
			onPress={() => onValueChange(!value)}
			style={styles.toggleRow}
		>
			<Switch
				value={value}
				onValueChange={onValueChange}
				trackColor={{ false: colors.muted, true: colors.primary }}
				thumbColor={colors.card}
				ios_backgroundColor={colors.muted}
			/>
			<View style={styles.toggleContent}>
				<Text style={[styles.toggleTitle, { color: colors.foreground }]}>
					{title}
				</Text>
				{description && (
					<Text style={[styles.toggleDescription, { color: colors.mutedForeground }]}>
						{description}
					</Text>
				)}
			</View>
		</Pressable>
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
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color={colors.primary} />
				</View>
			</SettingsScreen>
		);
	}

	return (
		<SettingsScreen title="Preferences">
			<View style={styles.content}>
				<ToggleRow
					title="Show thinking / reasoning traces"
					value={settings?.showReasoningTraces ?? true}
					onValueChange={(value) =>
						handleToggleSetting("showReasoningTraces", value)
					}
				/>

				<ToggleRow
					title="Auto-delete old sessions"
					description={
						settings?.autoDeleteEnabled
							? `Sessions older than ${settings?.autoDeleteAfterDays ?? 7} days`
							: "Sessions kept indefinitely"
					}
					value={settings?.autoDeleteEnabled ?? false}
					onValueChange={(value) =>
						handleToggleSetting("autoDeleteEnabled", value)
					}
				/>

				<ToggleRow
					title="Queue messages by default"
					description="Enter sends immediately, hold to queue"
					value={settings?.queueModeEnabled ?? false}
					onValueChange={(value) =>
						handleToggleSetting("queueModeEnabled", value)
					}
				/>
			</View>
		</SettingsScreen>
	);
}

const styles = StyleSheet.create({
	loadingContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	content: {
		paddingTop: Spacing[4],
		paddingHorizontal: Spacing[4],
		gap: Spacing[2],
	},
	toggleRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		paddingVertical: Spacing[2],
		gap: Spacing[3],
	},
	toggleContent: {
		flex: 1,
		paddingTop: 2,
	},
	toggleTitle: {
		fontSize: FontSizes.uiLabel,
		fontFamily: Fonts.medium,
	},
	toggleDescription: {
		fontSize: FontSizes.meta,
		fontFamily: Fonts.regular,
		marginTop: 2,
	},
});
