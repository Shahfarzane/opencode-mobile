import { Text, View } from "react-native";
import { Fonts, typography, useTheme } from "@/theme";

interface SettingsSectionProps {
	title?: string;
	description?: string;
	children: React.ReactNode;
	showDivider?: boolean;
}

export function SettingsSection({
	title,
	description,
	children,
	showDivider = true,
}: SettingsSectionProps) {
	const { colors } = useTheme();

	return (
		<View className="mt-4">
			{showDivider && (
				<View className="h-px mb-4" style={{ backgroundColor: colors.border }} />
			)}
			{(title || description) && (
				<View className="mb-3">
					{title && (
						<Text
							className="mb-1"
							style={[
								typography.uiLabel,
								{ color: colors.foreground, fontFamily: Fonts.semiBold },
							]}
						>
							{title}
						</Text>
					)}
					{description && (
						<Text style={[typography.meta, { color: colors.mutedForeground }]}>
							{description}
						</Text>
					)}
				</View>
			)}
			<View>{children}</View>
		</View>
	);
}
