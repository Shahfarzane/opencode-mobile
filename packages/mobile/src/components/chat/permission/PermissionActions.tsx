import { ActivityIndicator, View } from "react-native";
import { CheckIcon, ClockIcon, XIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { useTheme } from "@/theme";

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

	return (
		<View
			className="flex-row items-center gap-1.5 px-3 py-2 border-t"
			style={{ borderTopColor: colors.border }}
		>
			<Button
				variant="primary"
				size="xs"
				onPress={() => onResponse("once")}
				isDisabled={isResponding}
				className="flex-1"
			>
				<CheckIcon size={14} color={colors.primaryForeground} />
				<Button.Label>Allow Once</Button.Label>
			</Button>

			<Button
				variant="muted"
				size="xs"
				onPress={() => onResponse("always")}
				isDisabled={isResponding}
			>
				<ClockIcon size={14} color={colors.mutedForeground} />
				<Button.Label>Always</Button.Label>
			</Button>

			<Button
				variant="outline"
				size="xs"
				onPress={() => onResponse("reject")}
				isDisabled={isResponding}
			>
				<XIcon size={14} color={colors.destructive} />
				<Button.Label style={{ color: colors.destructive }}>Deny</Button.Label>
			</Button>

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
