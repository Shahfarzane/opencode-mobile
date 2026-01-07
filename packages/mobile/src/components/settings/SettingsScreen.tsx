import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, XIcon } from "@/components/icons";
import { Spacing, useTheme, Fonts } from "@/theme";

interface SettingsScreenProps {
	/** Screen title */
	title: string;
	/** Whether to show back button (default) or close button */
	showClose?: boolean;
	/** Custom back handler */
	onBack?: () => void;
	/** Content */
	children: React.ReactNode;
	/** Whether content should scroll (default: true) */
	scrollable?: boolean;
}

/**
 * Reusable settings screen wrapper with header.
 * Provides consistent navigation and styling.
 */
export function SettingsScreen({
	title,
	showClose = false,
	onBack,
	children,
	scrollable = true,
}: SettingsScreenProps) {
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();

	const handleBack = () => {
		if (onBack) {
			onBack();
		} else {
			router.back();
		}
	};

	const content = scrollable ? (
		<ScrollView
			style={styles.scrollView}
			contentContainerStyle={[
				styles.scrollContent,
				{ paddingBottom: insets.bottom + Spacing[4] },
			]}
			showsVerticalScrollIndicator={false}
		>
			{children}
		</ScrollView>
	) : (
		<View style={[styles.content, { paddingBottom: insets.bottom }]}>
			{children}
		</View>
	);

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<View
				style={[
					styles.header,
					{
						paddingTop: insets.top + Spacing[2],
						borderBottomColor: colors.border,
					},
				]}
			>
				<Pressable
					onPress={handleBack}
					style={styles.headerButton}
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
				>
					{showClose ? (
						<View style={[styles.closeButton, { backgroundColor: colors.muted }]}>
							<XIcon size={16} color={colors.foreground} />
						</View>
					) : (
						<ChevronLeft size={24} color={colors.foreground} />
					)}
				</Pressable>
				<Text style={[styles.title, { color: colors.foreground }]}>
					{title}
				</Text>
				<View style={styles.headerButton} />
			</View>
			{content}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: Spacing[4],
		paddingBottom: Spacing[3],
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	headerButton: {
		width: 40,
		height: 40,
		alignItems: "center",
		justifyContent: "center",
	},
	closeButton: {
		width: 32,
		height: 32,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
	},
	title: {
		fontSize: 17,
		fontFamily: Fonts.semiBold,
		textAlign: "center",
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		paddingTop: Spacing[4],
		paddingHorizontal: Spacing[4],
	},
	content: {
		flex: 1,
		paddingTop: Spacing[4],
		paddingHorizontal: Spacing[4],
	},
});
