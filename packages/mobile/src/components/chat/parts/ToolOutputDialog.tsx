import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import {
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { typography, useTheme } from "@/theme";
import type { ToolPartData } from "./ToolPart";

interface ToolOutputDialogProps {
	visible: boolean;
	onClose: () => void;
	part: ToolPartData;
}

function getToolIcon(toolName: string, color: string) {
	const name = toolName.toLowerCase();

	if (name === "edit" || name === "write" || name === "str_replace") {
		return (
			<Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
				<Path
					d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
					stroke={color}
					strokeWidth={2}
					strokeLinecap="round"
				/>
				<Path
					d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
					stroke={color}
					strokeWidth={2}
					strokeLinecap="round"
				/>
			</Svg>
		);
	}

	if (name === "read" || name === "cat") {
		return (
			<Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
				<Path
					d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
					stroke={color}
					strokeWidth={2}
					strokeLinecap="round"
				/>
				<Path
					d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
					stroke={color}
					strokeWidth={2}
				/>
			</Svg>
		);
	}

	if (name === "bash" || name === "shell" || name === "terminal") {
		return (
			<Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
				<Rect
					x="2"
					y="4"
					width="20"
					height="16"
					rx="2"
					stroke={color}
					strokeWidth={2}
				/>
				<Path
					d="M6 9l3 3-3 3M12 15h6"
					stroke={color}
					strokeWidth={2}
					strokeLinecap="round"
				/>
			</Svg>
		);
	}

	if (name === "grep" || name === "search" || name === "glob") {
		return (
			<Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
				<Circle cx="11" cy="11" r="8" stroke={color} strokeWidth={2} />
				<Path
					d="M21 21l-4.35-4.35"
					stroke={color}
					strokeWidth={2}
					strokeLinecap="round"
				/>
			</Svg>
		);
	}

	if (name === "task") {
		return (
			<Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
				<Path
					d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
					stroke={color}
					strokeWidth={2}
					strokeLinecap="round"
				/>
			</Svg>
		);
	}

	return (
		<Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
			<Path
				d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
			/>
		</Svg>
	);
}

function CloseIcon({ color }: { color: string }) {
	return (
		<Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
			<Path
				d="M18 6L6 18M6 6l12 12"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
			/>
		</Svg>
	);
}

function CopyIcon({ color }: { color: string }) {
	return (
		<Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
			<Rect
				x="9"
				y="9"
				width="13"
				height="13"
				rx="2"
				stroke={color}
				strokeWidth={2}
			/>
			<Path
				d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
				stroke={color}
				strokeWidth={2}
			/>
		</Svg>
	);
}

function formatInputForDisplay(input: Record<string, unknown>): string {
	return JSON.stringify(input, null, 2);
}

export function ToolOutputDialog({
	visible,
	onClose,
	part,
}: ToolOutputDialogProps) {
	const { colors, isDark } = useTheme();
	const toolName = part.toolName || "Tool";

	const handleCopyOutput = async () => {
		const content = part.output || part.error || "";
		if (content) {
			await Clipboard.setStringAsync(content);
			await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		}
	};

	const handleCopyInput = async () => {
		if (part.input) {
			await Clipboard.setStringAsync(formatInputForDisplay(part.input));
			await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		}
	};

	return (
		<Modal
			visible={visible}
			animationType="slide"
			presentationStyle="pageSheet"
			onRequestClose={onClose}
		>
			<View style={[styles.container, { backgroundColor: colors.background }]}>
				<View style={[styles.header, { borderBottomColor: colors.border }]}>
					<View style={styles.headerTitle}>
						{getToolIcon(toolName, colors.info)}
						<Text style={[typography.uiHeader, { color: colors.foreground }]}>
							{toolName}
						</Text>
					</View>
					<Pressable onPress={onClose} hitSlop={12} style={styles.closeButton}>
						<CloseIcon color={colors.mutedForeground} />
					</Pressable>
				</View>

				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
				>
					{part.input && Object.keys(part.input).length > 0 && (
						<View style={styles.section}>
							<View style={styles.sectionHeader}>
								<Text
									style={[
										typography.uiLabel,
										{ color: colors.mutedForeground },
									]}
								>
									Input
								</Text>
								<Pressable onPress={handleCopyInput} hitSlop={8}>
									<CopyIcon color={colors.mutedForeground} />
								</Pressable>
							</View>
							<View
								style={[
									styles.codeBlock,
									{
										backgroundColor: isDark
											? "rgba(28, 27, 26, 0.5)"
											: "rgba(242, 240, 229, 0.5)",
										borderColor: colors.border,
									},
								]}
							>
								<Text style={[typography.code, { color: colors.foreground }]}>
									{formatInputForDisplay(part.input)}
								</Text>
							</View>
						</View>
					)}

					{part.output && part.output.trim().length > 0 && (
						<View style={styles.section}>
							<View style={styles.sectionHeader}>
								<Text
									style={[
										typography.uiLabel,
										{ color: colors.mutedForeground },
									]}
								>
									Output
								</Text>
								<Pressable onPress={handleCopyOutput} hitSlop={8}>
									<CopyIcon color={colors.mutedForeground} />
								</Pressable>
							</View>
							<View
								style={[
									styles.codeBlock,
									{
										backgroundColor: isDark
											? "rgba(28, 27, 26, 0.5)"
											: "rgba(242, 240, 229, 0.5)",
										borderColor: colors.border,
									},
								]}
							>
								<Text
									style={[typography.code, { color: colors.foreground }]}
									selectable
								>
									{part.output}
								</Text>
							</View>
						</View>
					)}

					{part.error && part.error.trim().length > 0 && (
						<View style={styles.section}>
							<View style={styles.sectionHeader}>
								<Text
									style={[typography.uiLabel, { color: colors.destructive }]}
								>
									Error
								</Text>
								<Pressable onPress={handleCopyOutput} hitSlop={8}>
									<CopyIcon color={colors.mutedForeground} />
								</Pressable>
							</View>
							<View
								style={[
									styles.codeBlock,
									{
										backgroundColor: `${colors.destructive}10`,
										borderColor: colors.destructive,
									},
								]}
							>
								<Text
									style={[typography.code, { color: colors.destructive }]}
									selectable
								>
									{part.error}
								</Text>
							</View>
						</View>
					)}

					{!part.output && !part.error && (
						<View style={styles.emptyState}>
							<Text
								style={[typography.body, { color: colors.mutedForeground }]}
							>
								Command completed successfully
							</Text>
							<Text
								style={[typography.micro, { color: colors.mutedForeground }]}
							>
								No output was produced
							</Text>
						</View>
					)}
				</ScrollView>
			</View>
		</Modal>
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
		paddingHorizontal: 16,
		paddingVertical: 14,
		borderBottomWidth: 1,
	},
	headerTitle: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},
	closeButton: {
		padding: 4,
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		padding: 16,
		paddingBottom: 40,
	},
	section: {
		marginBottom: 20,
	},
	sectionHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 8,
	},
	codeBlock: {
		borderRadius: 8,
		borderWidth: 1,
		padding: 12,
	},
	emptyState: {
		alignItems: "center",
		paddingVertical: 40,
		gap: 8,
	},
});
