import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { fontStyle, typography, useTheme } from "@/theme";
import { OPACITY, withOpacity } from "@/utils/colors";
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
	const { colors } = useTheme();
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
			<View className="flex-1" style={{ backgroundColor: colors.background }}>
				<View className="flex-row items-center justify-between px-4 py-3">
					<View className="flex-row items-center gap-2">
						{getToolIcon(toolName, colors.foreground)}
						<Text
							style={[
								typography.uiHeader,
								fontStyle("600"),
								{ color: colors.foreground },
							]}
						>
							{toolName}
						</Text>
					</View>
					<Pressable onPress={onClose} hitSlop={12} className="p-1">
						<CloseIcon color={colors.mutedForeground} />
					</Pressable>
				</View>

				<View
					className="flex-1 mx-4 mb-4 rounded-xl border overflow-hidden"
					style={{
						backgroundColor: withOpacity(colors.card, OPACITY.overlay),
						borderColor: withOpacity(colors.border, OPACITY.overlay),
					}}
				>
					<ScrollView
						className="flex-1"
						contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
					>
						{part.input && Object.keys(part.input).length > 0 && (
							<View className="mb-4">
								<View className="flex-row items-center justify-between mb-2">
									<Text
										style={[
											typography.meta,
											fontStyle("500"),
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
									className="rounded-xl border p-3"
									style={{
										backgroundColor: "transparent",
										borderColor: withOpacity(colors.border, OPACITY.emphasized),
									}}
								>
									<Text style={[typography.code, { color: colors.foreground }]}>
										{formatInputForDisplay(part.input)}
									</Text>
								</View>
							</View>
						)}

						{part.output && part.output.trim().length > 0 && (
							<View className="mb-4">
								<View className="flex-row items-center justify-between mb-2">
									<Text
										style={[
											typography.meta,
											fontStyle("500"),
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
									className="rounded-xl border p-3"
									style={{
										backgroundColor: "transparent",
										borderColor: withOpacity(colors.border, OPACITY.emphasized),
									}}
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
							<View className="mb-4">
								<View className="flex-row items-center justify-between mb-2">
									<Text
										style={[
											typography.meta,
											fontStyle("500"),
											{ color: colors.destructive },
										]}
									>
										Error
									</Text>
									<Pressable onPress={handleCopyOutput} hitSlop={8}>
										<CopyIcon color={colors.mutedForeground} />
									</Pressable>
								</View>
								<View
									className="rounded-xl border p-3"
									style={{
										backgroundColor: withOpacity(
											colors.destructive,
											OPACITY.hover,
										),
										borderColor: withOpacity(
											colors.destructive,
											OPACITY.emphasized,
										),
									}}
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
							<View className="items-center py-10 gap-2">
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
			</View>
		</Modal>
	);
}
