import { useState } from "react";
import { View } from "react-native";
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
			className="border rounded-xl overflow-hidden my-1"
			style={{
				backgroundColor: colors.muted,
				borderColor: colors.border,
			}}
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
