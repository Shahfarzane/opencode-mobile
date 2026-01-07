import { Pressable, View } from "react-native";
import { XIcon } from "@/components/icons";
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
			<Pressable
				onPress={onClose}
				hitSlop={8}
				className="p-1.5"
				style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
			>
				<XIcon color={colors.mutedForeground} size={18} />
			</Pressable>
		</View>
	);
}
