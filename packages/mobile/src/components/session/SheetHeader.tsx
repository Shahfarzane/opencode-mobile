import { Pressable, StyleSheet, View } from "react-native";
import { XIcon } from "@/components/icons";
import { useTheme } from "@/theme";

interface SheetHeaderProps {
	title?: string;
	onClose: () => void;
}

export function SheetHeader({ onClose }: SheetHeaderProps) {
	const { colors } = useTheme();

	return (
		<View style={styles.header}>
			<View style={styles.spacer} />
			<Pressable
				onPress={onClose}
				hitSlop={8}
				style={({ pressed }) => [
					styles.closeButton,
					{
						opacity: pressed ? 0.6 : 1,
					},
				]}
			>
				<XIcon color={colors.mutedForeground} size={18} />
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	header: {
		flexDirection: "row",
		justifyContent: "flex-end",
		alignItems: "center",
		paddingHorizontal: 12,
		paddingTop: 4,
		paddingBottom: 0,
	},
	spacer: {
		flex: 1,
	},
	closeButton: {
		padding: 6,
	},
});
