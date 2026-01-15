import type BottomSheet from "@gorhom/bottom-sheet";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useRef } from "react";
import { Text, View } from "react-native";
import {
	BookIcon,
	CopyIcon,
	FileEditIcon,
	FileIcon,
	FileSearchIcon,
	Folder6Icon,
	GitBranchIcon,
	GlobeIcon,
	LayersIcon,
	MenuSearchIcon,
	PencilIcon,
	TerminalIcon,
	ToolIcon,
	XIcon,
} from "@/components/icons";
import { IconButton } from "@/components/ui";
import { Sheet, SheetScrollView } from "@/components/ui/sheet";
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

	if (
		name === "edit" ||
		name === "multiedit" ||
		name === "str_replace" ||
		name === "str_replace_based_edit_tool"
	) {
		return <PencilIcon size={16} color={color} />;
	}

	if (name === "write" || name === "create" || name === "file_write") {
		return <FileEditIcon size={16} color={color} />;
	}

	if (
		name === "read" ||
		name === "view" ||
		name === "file_read" ||
		name === "cat"
	) {
		return <FileIcon size={16} color={color} />;
	}

	if (
		name === "bash" ||
		name === "shell" ||
		name === "cmd" ||
		name === "terminal"
	) {
		return <TerminalIcon size={16} color={color} />;
	}

	if (name === "list" || name === "ls" || name === "dir" || name === "list_files") {
		return <Folder6Icon size={16} color={color} />;
	}

	if (
		name === "search" ||
		name === "grep" ||
		name === "find" ||
		name === "ripgrep"
	) {
		return <MenuSearchIcon size={16} color={color} />;
	}

	if (name === "glob") {
		return <FileSearchIcon size={16} color={color} />;
	}

	if (
		name === "fetch" ||
		name === "curl" ||
		name === "wget" ||
		name === "webfetch"
	) {
		return <GlobeIcon size={16} color={color} />;
	}

	if (
		name === "web-search" ||
		name === "websearch" ||
		name === "search_web" ||
		name === "codesearch" ||
		name === "google" ||
		name === "bing" ||
		name === "duckduckgo" ||
		name === "perplexity"
	) {
		return <GlobeIcon size={16} color={color} />;
	}

	if (name === "todowrite" || name === "todoread" || name === "task") {
		return <LayersIcon size={16} color={color} />;
	}

	if (name === "skill") {
		return <BookIcon size={16} color={color} />;
	}

	if (name.startsWith("git")) {
		return <GitBranchIcon size={16} color={color} />;
	}

	return <ToolIcon size={16} color={color} />;
}

function formatInputForDisplay(input: Record<string, unknown>): string {
	return JSON.stringify(input, null, 2);
}

export function ToolOutputDialog({ visible, onClose, part }: ToolOutputDialogProps) {
	const { colors } = useTheme();
	const toolName = part.toolName || "Tool";
	const sheetRef = useRef<BottomSheet>(null);
	const snapPoints = useMemo(() => ["85%"], []);

	useEffect(() => {
		if (visible) {
			sheetRef.current?.snapToIndex(0);
		} else {
			sheetRef.current?.close();
		}
	}, [visible]);

	if (!visible) {
		return null;
	}

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
		<Sheet ref={sheetRef} snapPoints={snapPoints} onClose={onClose} contentPadding={0}>
			<View className="px-4 pt-2 pb-3 flex-row items-center justify-between">
				<View className="flex-row items-center gap-2">
					{getToolIcon(toolName, colors.foreground)}
					<Text style={[typography.uiHeader, fontStyle("600"), { color: colors.foreground }]}>{toolName}</Text>
				</View>
				<IconButton
					icon={<XIcon size={20} color={colors.mutedForeground} />}
					variant="ghost"
					size="icon-sm"
					onPress={() => sheetRef.current?.close()}
					accessibilityLabel="Close"
				/>
			</View>
			<View className="border-t" style={{ borderTopColor: colors.border }} />

			<View className="mx-4 my-3 rounded-xl border overflow-hidden" style={{ backgroundColor: withOpacity(colors.card, OPACITY.overlay), borderColor: withOpacity(colors.border, OPACITY.overlay) }}>
				<SheetScrollView contentContainerStyle={{ padding: 12, paddingBottom: 40 }}>
					{part.input && Object.keys(part.input).length > 0 && (
						<View className="mb-4">
							<View className="flex-row items-center justify-between mb-2">
								<Text style={[typography.meta, fontStyle("500"), { color: colors.mutedForeground }]}>Input</Text>
								<IconButton
									icon={<CopyIcon size={18} color={colors.mutedForeground} />}
									variant="ghost"
									size="icon-sm"
									onPress={handleCopyInput}
									accessibilityLabel="Copy input"
								/>
							</View>
							<View className="rounded-xl border p-3" style={{ backgroundColor: "transparent", borderColor: withOpacity(colors.border, OPACITY.emphasized) }}>
								<Text style={[typography.code, { color: colors.foreground }]}>{formatInputForDisplay(part.input)}</Text>
							</View>
						</View>
					)}

					{part.output && part.output.trim().length > 0 && (
						<View className="mb-4">
							<View className="flex-row items-center justify-between mb-2">
								<Text style={[typography.meta, fontStyle("500"), { color: colors.mutedForeground }]}>Output</Text>
								<IconButton
									icon={<CopyIcon size={18} color={colors.mutedForeground} />}
									variant="ghost"
									size="icon-sm"
									onPress={handleCopyOutput}
									accessibilityLabel="Copy output"
								/>
							</View>
							<View className="rounded-xl border p-3" style={{ backgroundColor: "transparent", borderColor: withOpacity(colors.border, OPACITY.emphasized) }}>
								<Text style={[typography.code, { color: colors.foreground }]}>{part.output}</Text>
							</View>
						</View>
					)}

					{part.error && part.error.trim().length > 0 && (
						<View>
							<Text style={[typography.meta, fontStyle("500"), { color: colors.destructive, marginBottom: 8 }]}>Error</Text>
							<View className="rounded-xl border p-3" style={{ backgroundColor: withOpacity(colors.destructive, 0.08), borderColor: withOpacity(colors.destructive, 0.2) }}>
								<Text style={[typography.code, { color: colors.destructive }]}>{part.error}</Text>
							</View>
						</View>
					)}
				</SheetScrollView>
			</View>
		</Sheet>
	);
}
