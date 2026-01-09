import * as Haptics from "expo-haptics";
import {
	ActivityIndicator,
	Pressable,
	Text,
	View,
} from "react-native";
import { CheckIcon, ClockIcon, XIcon } from "@/components/icons";
import { fontStyle, typography, useTheme } from "@/theme";
import { withOpacity, OPACITY } from "@/utils/colors";

export type PermissionResponse = "once" | "always" | "reject";

interface PermissionActionsProps {
	onResponse: (response: PermissionResponse) => void;
	isResponding: boolean;
}

export function PermissionActions({
	onResponse,
	isResponding,
}: PermissionActionsProps) {
	const { colors } = useTheme();

	const handlePress = async (response: PermissionResponse) => {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		onResponse(response);
	};

	return (
		<View
			className="flex-row items-center gap-1.5 px-3 py-2 border-t"
			style={{ borderTopColor: colors.border }}
		>
			<Pressable
				onPress={() => handlePress("once")}
				disabled={isResponding}
				className="flex-1 flex-row items-center justify-center gap-1 px-2 py-1.5 rounded-md"
				style={({ pressed }) => ({
					backgroundColor: colors.primary,
					opacity: pressed ? 0.8 : isResponding ? 0.5 : 1,
				})}
			>
				<CheckIcon size={14} color={colors.primaryForeground} />
				<Text
					style={[
						typography.meta,
						fontStyle("600"),
						{ color: colors.primaryForeground },
					]}
				>
					Allow Once
				</Text>
			</Pressable>

			<Pressable
				onPress={() => handlePress("always")}
				disabled={isResponding}
				className="flex-row items-center gap-1 px-2 py-1.5 rounded-md"
				style={({ pressed }) => ({
					backgroundColor: colors.muted,
					opacity: pressed ? 0.8 : isResponding ? 0.5 : 1,
				})}
			>
				<ClockIcon size={14} color={colors.mutedForeground} />
				<Text
					style={[
						typography.meta,
						fontStyle("500"),
						{ color: colors.mutedForeground },
					]}
				>
					Always
				</Text>
			</Pressable>

			<Pressable
				onPress={() => handlePress("reject")}
				disabled={isResponding}
				className="flex-row items-center gap-1 px-2 py-1.5 rounded-md"
				style={({ pressed }) => ({
					backgroundColor: withOpacity(colors.destructive, OPACITY.active),
					opacity: pressed ? 0.8 : isResponding ? 0.5 : 1,
				})}
			>
				<XIcon size={14} color={colors.destructive} />
				<Text
					style={[typography.meta, fontStyle("500"), { color: colors.destructive }]}
				>
					Deny
				</Text>
			</Pressable>

			{isResponding && (
				<ActivityIndicator
					size="small"
					color={colors.primary}
					style={{ marginLeft: "auto" }}
				/>
			)}
		</View>
	);
}
