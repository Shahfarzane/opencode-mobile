import * as Haptics from "expo-haptics";
import {
	ActivityIndicator,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { CheckIcon, ClockIcon, XIcon } from "@/components/icons";
import { typography, useTheme } from "@/theme";

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
		<View style={[styles.actions, { borderTopColor: colors.border }]}>
			<Pressable
				onPress={() => handlePress("once")}
				disabled={isResponding}
				style={({ pressed }) => [
					styles.actionButton,
					styles.primaryButton,
					{ backgroundColor: colors.primary },
					pressed && styles.actionButtonPressed,
					isResponding && styles.actionButtonDisabled,
				]}
			>
				<CheckIcon size={14} color={colors.primaryForeground} />
				<Text
					style={[
						typography.meta,
						{ color: colors.primaryForeground, fontWeight: "600" },
					]}
				>
					Allow Once
				</Text>
			</Pressable>

			<Pressable
				onPress={() => handlePress("always")}
				disabled={isResponding}
				style={({ pressed }) => [
					styles.actionButton,
					{ backgroundColor: colors.muted },
					pressed && styles.actionButtonPressed,
					isResponding && styles.actionButtonDisabled,
				]}
			>
				<ClockIcon size={14} color={colors.mutedForeground} />
				<Text
					style={[
						typography.meta,
						{ color: colors.mutedForeground, fontWeight: "500" },
					]}
				>
					Always
				</Text>
			</Pressable>

			<Pressable
				onPress={() => handlePress("reject")}
				disabled={isResponding}
				style={({ pressed }) => [
					styles.actionButton,
					{ backgroundColor: colors.errorBackground },
					pressed && styles.actionButtonPressed,
					isResponding && styles.actionButtonDisabled,
				]}
			>
				<XIcon size={14} color={colors.error} />
				<Text
					style={[typography.meta, { color: colors.error, fontWeight: "500" }]}
				>
					Deny
				</Text>
			</Pressable>

			{isResponding && (
				<ActivityIndicator
					size="small"
					color={colors.primary}
					style={styles.loader}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	actions: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderTopWidth: 1,
	},
	actionButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 8,
	},
	primaryButton: {
		flex: 1,
		justifyContent: "center",
	},
	actionButtonPressed: {
		opacity: 0.8,
	},
	actionButtonDisabled: {
		opacity: 0.5,
	},
	loader: {
		marginLeft: "auto",
	},
});
