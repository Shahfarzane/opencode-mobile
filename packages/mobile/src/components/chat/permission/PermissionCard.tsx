import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@/theme";
import { PermissionActions } from "./PermissionActions";
import { PermissionDetails } from "./PermissionDetails";
import { PermissionHeader } from "./PermissionHeader";
import type { Permission, PermissionResponse } from "./types";

interface PermissionCardProps {
	permission: Permission;
	onResponse?: (response: PermissionResponse) => Promise<void>;
}

export function PermissionCard({
	permission,
	onResponse,
}: PermissionCardProps) {
	const { colors } = useTheme();
	const [isResponding, setIsResponding] = useState(false);
	const [hasResponded, setHasResponded] = useState(false);

	const handleResponse = async (response: PermissionResponse) => {
		if (!onResponse) return;

		setIsResponding(true);
		try {
			await onResponse(response);
			setHasResponded(true);
		} catch {
			// Error handling can be added here
		} finally {
			setIsResponding(false);
		}
	};

	if (hasResponded) {
		return null;
	}

	return (
		<View
			style={[
				styles.container,
				{
					backgroundColor: colors.toolBackground,
					borderColor: colors.toolBorder,
				},
			]}
		>
			<PermissionHeader
				toolName={permission.type || "Unknown Tool"}
				createdTime={permission.time.created}
			/>

			<PermissionDetails permission={permission} />

			<PermissionActions
				onResponse={handleResponse}
				isResponding={isResponding}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		borderWidth: 1,
		borderRadius: 12,
		overflow: "hidden",
		marginVertical: 4,
	},
});
