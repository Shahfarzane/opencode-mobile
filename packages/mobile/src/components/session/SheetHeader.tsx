import { View } from "react-native";
import { XIcon } from "@/components/icons";
import { IconButton } from "@/components/ui";
import { useTheme } from "@/theme";

interface SheetHeaderProps {
	title?: string;
	onClose: () => void;
}

export function SheetHeader({ onClose }: SheetHeaderProps) {
	const { colors } = useTheme();

	return (
		<View className="flex-row justify-end items-center px-3 pt-1 pb-0">
			<View className="flex-1" />
			<IconButton
				icon={<XIcon color={colors.mutedForeground} size={18} />}
				variant="ghost"
				size="icon-sm"
				onPress={onClose}
				accessibilityLabel="Close"
			/>
		</View>
	);
}
