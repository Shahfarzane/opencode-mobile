import { Pressable, StyleSheet, Text, View } from "react-native";
import { XIcon } from "@/components/icons";
import { typography, useTheme } from "@/theme";

interface SheetHeaderProps {
	title: string;
	onClose: () => void;
}

export function SheetHeader({ title, onClose }: SheetHeaderProps) {
	const { colors } = useTheme();

	return (
		<>
			<View style={styles.header}>
				<Text style={[typography.uiHeader, { color: colors.foreground }]}>
					{title}
				</Text>
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
					<XIcon color={colors.mutedForeground} size={20} />
				</Pressable>
			</View>
			<View style={[styles.divider, { backgroundColor: colors.border }]} />
		</>
	);
}

const styles = StyleSheet.create({
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 20,
		paddingVertical: 14,
	},
	closeButton: {
		padding: 4,
	},
	divider: {
		height: 1,
	},
});
