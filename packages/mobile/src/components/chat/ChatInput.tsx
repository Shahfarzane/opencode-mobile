import { FlashList } from "@shopify/flash-list";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	Animated,
	Keyboard,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { AiAgentIcon } from "@/components/icons";
import { FontSizes, Fonts, fontStyle, typography, useTheme } from "@/theme";
import {
	type AttachedFile,
	AttachedFilesList,
	FileAttachmentButton,
} from "./FileAttachment";

type AutocompleteType = "agent" | "command" | "file" | null;

interface AgentItem {
	type: "agent";
	name: string;
	description?: string;
}

interface CommandItem {
	type: "command";
	name: string;
	description?: string;
}

interface FileItem {
	type: "file";
	name: string;
	path: string;
	extension?: string;
}

type AutocompleteItem = AgentItem | CommandItem | FileItem;

type EditPermissionMode = "ask" | "allow" | "full" | "deny";

interface ModelInfo {
	modelId: string;
	modelName: string;
	providerId: string;
	providerName: string;
}

interface AgentInfo {
	name: string;
	color?: string;
}

interface ChatInputProps {
	onSend: (message: string, attachedFiles?: AttachedFile[]) => void;
	isLoading?: boolean;
	placeholder?: string;
	agents?: Array<{ name: string; description?: string }>;
	commands?: Array<{ name: string; description?: string }>;
	onFileSearch?: (
		query: string,
	) => Promise<Array<{ name: string; path: string; extension?: string }>>;
	permissionMode?: EditPermissionMode;
	modelInfo?: ModelInfo;
	activeAgent?: AgentInfo;
	onModelPress?: () => void;
	onAgentPress?: () => void;
}

function SendIcon({ color, size = 20 }: { color: string; size?: number }) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Path
				d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

function StopIcon({ color, size = 20 }: { color: string; size?: number }) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Path
				d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
				stroke={color}
				strokeWidth={2}
			/>
			<Path d="M15 9H9v6h6V9z" fill={color} />
		</Svg>
	);
}

function AgentIcon() {
	const { colors } = useTheme();
	return (
		<View style={[styles.triggerIcon, { backgroundColor: `${colors.info}15` }]}>
			<Text style={[styles.triggerIconText, { color: colors.info }]}>#</Text>
		</View>
	);
}

function CommandIcon() {
	const { colors } = useTheme();
	return (
		<View
			style={[styles.triggerIcon, { backgroundColor: `${colors.warning}15` }]}
		>
			<Text style={[styles.triggerIconText, { color: colors.warning }]}>/</Text>
		</View>
	);
}

function FileIcon({ extension }: { extension?: string }) {
	const { colors } = useTheme();

	const getColor = () => {
		switch (extension?.toLowerCase()) {
			case "ts":
			case "tsx":
			case "js":
			case "jsx":
				return colors.info;
			case "json":
				return colors.warning;
			case "md":
			case "mdx":
				return colors.mutedForeground;
			case "png":
			case "jpg":
			case "jpeg":
			case "gif":
			case "svg":
				return colors.success;
			default:
				return colors.mutedForeground;
		}
	};

	return (
		<View
			style={[
				styles.triggerIcon,
				{ backgroundColor: `${colors.mutedForeground}15` },
			]}
		>
			<Text style={[styles.triggerIconText, { color: getColor() }]}>@</Text>
		</View>
	);
}

function AutocompleteOverlay({
	type,
	items,
	onSelect,
}: {
	type: AutocompleteType;
	items: AutocompleteItem[];
	onSelect: (item: AutocompleteItem) => void;
	onClose: () => void;
}) {
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const slideAnim = useRef(new Animated.Value(8)).current;
	const { colors } = useTheme();

	useEffect(() => {
		Animated.parallel([
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 150,
				useNativeDriver: true,
			}),
			Animated.timing(slideAnim, {
				toValue: 0,
				duration: 150,
				useNativeDriver: true,
			}),
		]).start();
	}, [fadeAnim, slideAnim]);

	const renderItem = useCallback(
		({ item }: { item: AutocompleteItem }) => (
			<Pressable
				onPress={() => {
					Haptics.selectionAsync();
					onSelect(item);
				}}
				style={({ pressed }) => [
					styles.autocompleteItem,
					pressed && { backgroundColor: `${colors.foreground}08` },
				]}
			>
				{item.type === "agent" && <AgentIcon />}
				{item.type === "command" && <CommandIcon />}
				{item.type === "file" && <FileIcon extension={item.extension} />}
				<View style={styles.autocompleteItemContent}>
					<Text style={[typography.code, { color: colors.foreground }]}>
						{item.type === "agent" && `#${item.name}`}
						{item.type === "command" && `/${item.name}`}
						{item.type === "file" && `@${item.name}`}
					</Text>
					{"description" in item && item.description && (
						<Text
							style={[typography.micro, { color: colors.mutedForeground }]}
							numberOfLines={1}
						>
							{item.description}
						</Text>
					)}
					{item.type === "file" && (
						<Text
							style={[typography.micro, { color: colors.mutedForeground }]}
							numberOfLines={1}
						>
							{item.path}
						</Text>
					)}
				</View>
			</Pressable>
		),
		[onSelect, colors.foreground, colors.mutedForeground],
	);

	const getTitle = () => {
		switch (type) {
			case "agent":
				return "Agents";
			case "command":
				return "Commands";
			case "file":
				return "Files";
			default:
				return "";
		}
	};

	if (items.length === 0) {
		return null;
	}

	return (
		<Animated.View
			style={[
				styles.autocompleteOverlay,
				{
					opacity: fadeAnim,
					transform: [{ translateY: slideAnim }],
					borderColor: colors.border,
					backgroundColor: colors.background,
					shadowColor: colors.foreground,
				},
			]}
		>
			<View
				style={[
					styles.autocompleteHeader,
					{ borderBottomColor: colors.border },
				]}
			>
				<Text
					style={[
						typography.micro,
						fontStyle("600"),
						{ color: colors.mutedForeground },
					]}
				>
					{getTitle()}
				</Text>
			</View>
			<FlashList
				data={items}
				renderItem={renderItem}
				keyExtractor={(item) =>
					item.type === "file" ? item.path : `${item.type}-${item.name}`
				}
				keyboardShouldPersistTaps="handled"
				ListFooterComponent={() => <View style={{ height: 56 }} />}
			/>
		</Animated.View>
	);
}

function getPermissionModeColors(
	mode: EditPermissionMode | undefined,
	colors: ReturnType<typeof useTheme>["colors"],
) {
	if (mode === "full") {
		return { border: colors.infoBorder, text: colors.info };
	}
	if (mode === "allow") {
		return { border: colors.successBorder, text: colors.success };
	}
	return null;
}

// Provider logo component matching desktop UI
function ProviderLogo({ providerId }: { providerId: string }) {
	const { colors } = useTheme();

	// Map provider IDs to display symbols (matching desktop's ProviderLogo)
	const getProviderSymbol = (id: string) => {
		const normalizedId = id.toLowerCase();
		if (normalizedId.includes("anthropic")) return "A\\";
		if (normalizedId.includes("openai")) return "O";
		if (normalizedId.includes("google") || normalizedId.includes("gemini"))
			return "G";
		if (normalizedId.includes("mistral")) return "M";
		if (normalizedId.includes("groq")) return "Gr";
		if (normalizedId.includes("ollama")) return "Ol";
		if (normalizedId.includes("openrouter")) return "OR";
		if (normalizedId.includes("deepseek")) return "DS";
		return id.charAt(0).toUpperCase();
	};

	return (
			<Text
				style={[
					typography.micro,
					fontStyle("600"),
					{ color: colors.mutedForeground },
				]}
			>
				{getProviderSymbol(providerId)}
		</Text>
	);
}

// Agent badge component with color support and icon
function AgentBadge({ name, color }: { name: string; color?: string }) {
	// Default agent colors based on name hash (matching desktop's getAgentColor)
	const getAgentColor = (agentName: string) => {
		if (color) return color;

		// Simple hash-based color selection
		const agentColors = [
			"#3B82F6", // blue
			"#10B981", // emerald
			"#F59E0B", // amber
			"#EF4444", // red
			"#8B5CF6", // violet
			"#EC4899", // pink
			"#06B6D4", // cyan
			"#84CC16", // lime
		];

		let hash = 0;
		for (let i = 0; i < agentName.length; i++) {
			hash = agentName.charCodeAt(i) + ((hash << 5) - hash);
		}
		return agentColors[Math.abs(hash) % agentColors.length];
	};

	const badgeColor = getAgentColor(name);
	const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);

	return (
		<View style={styles.agentBadgeContainer}>
			<AiAgentIcon size={14} color={badgeColor} />
			<Text
				style={[typography.micro, fontStyle("500"), { color: badgeColor }]}
			>
				{capitalizedName}
			</Text>
		</View>
	);
}

export function ChatInput({
	onSend,
	isLoading = false,
	placeholder = "# for agents; @ for files; / for commands",
	agents = [],
	commands = [],
	onFileSearch,
	permissionMode,
	modelInfo,
	activeAgent,
	onModelPress,
	onAgentPress,
}: ChatInputProps) {
	const { colors } = useTheme();
	const permissionColors = getPermissionModeColors(permissionMode, colors);
	const inputRef = useRef<TextInput>(null);

	const [text, setText] = useState("");
	const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
	const [autocompleteType, setAutocompleteType] =
		useState<AutocompleteType>(null);
	const [autocompleteQuery, setAutocompleteQuery] = useState("");
	const [autocompleteItems, setAutocompleteItems] = useState<
		AutocompleteItem[]
	>([]);
	const [, setCursorPosition] = useState(0);

	const handleFileAttached = useCallback((file: AttachedFile) => {
		setAttachedFiles((prev) => [...prev, file]);
	}, []);

	const handleFileRemove = useCallback((fileId: string) => {
		setAttachedFiles((prev) => prev.filter((f) => f.id !== fileId));
	}, []);

	const parseTrigger = useCallback(
		(
			inputText: string,
			cursor: number,
		): { type: AutocompleteType; query: string; startIndex: number } | null => {
			const textBeforeCursor = inputText.slice(0, cursor);
			const lastSpace = Math.max(
				textBeforeCursor.lastIndexOf(" "),
				textBeforeCursor.lastIndexOf("\n"),
			);
			const word = textBeforeCursor.slice(lastSpace + 1);

			if (word.startsWith("#")) {
				return {
					type: "agent",
					query: word.slice(1),
					startIndex: lastSpace + 1,
				};
			}
			if (word.startsWith("/") && lastSpace === -1) {
				return {
					type: "command",
					query: word.slice(1),
					startIndex: lastSpace + 1,
				};
			}
			if (word.startsWith("@")) {
				return {
					type: "file",
					query: word.slice(1),
					startIndex: lastSpace + 1,
				};
			}

			return null;
		},
		[],
	);

	const getFilteredAgents = useCallback(
		(query: string): AutocompleteItem[] => {
			const lowerQuery = query.toLowerCase();
			return agents
				.filter((agent) => agent.name.toLowerCase().includes(lowerQuery))
				.slice(0, 10)
				.map((agent) => ({
					type: "agent" as const,
					name: agent.name,
					description: agent.description,
				}));
		},
		[agents],
	);

	const getFilteredCommands = useCallback(
		(query: string): AutocompleteItem[] => {
			const lowerQuery = query.toLowerCase();
			const builtInCommands = [
				{ name: "init", description: "Create/update AGENTS.md file" },
				{ name: "summarize", description: "Generate a summary of the session" },
			];

			const allCommands = [...builtInCommands, ...commands];
			return allCommands
				.filter((cmd) => cmd.name.toLowerCase().includes(lowerQuery))
				.slice(0, 10)
				.map((cmd) => ({
					type: "command" as const,
					name: cmd.name,
					description: cmd.description,
				}));
		},
		[commands],
	);

	const handleTextChange = useCallback(
		(newText: string) => {
			setText(newText);

			const trigger = parseTrigger(newText, newText.length);

			if (trigger) {
				setAutocompleteType(trigger.type);
				setAutocompleteQuery(trigger.query);

				if (trigger.type === "agent") {
					setAutocompleteItems(getFilteredAgents(trigger.query));
				} else if (trigger.type === "command") {
					setAutocompleteItems(getFilteredCommands(trigger.query));
				}
			} else {
				setAutocompleteType(null);
				setAutocompleteQuery("");
				setAutocompleteItems([]);
			}
		},
		[parseTrigger, getFilteredAgents, getFilteredCommands],
	);

	useEffect(() => {
		if (autocompleteType !== "file" || !onFileSearch) {
			return;
		}

		let cancelled = false;

		const searchFiles = async () => {
			try {
				const files = await onFileSearch(autocompleteQuery);
				if (!cancelled) {
					setAutocompleteItems(
						files.slice(0, 15).map((file) => ({
							type: "file" as const,
							name: file.name,
							path: file.path,
							extension: file.extension,
						})),
					);
				}
			} catch {
				if (!cancelled) {
					setAutocompleteItems([]);
				}
			}
		};

		const debounceTimer = setTimeout(searchFiles, 150);
		return () => {
			cancelled = true;
			clearTimeout(debounceTimer);
		};
	}, [autocompleteType, autocompleteQuery, onFileSearch]);

	const handleAutocompleteSelect = useCallback(
		(item: AutocompleteItem) => {
			const trigger = parseTrigger(text, text.length);
			if (!trigger) return;

			let replacement: string;
			switch (item.type) {
				case "agent":
					replacement = `#${item.name} `;
					break;
				case "command":
					replacement = `/${item.name} `;
					break;
				case "file":
					replacement = `@${item.path} `;
					break;
			}

			const newText =
				text.slice(0, trigger.startIndex) +
				replacement +
				text.slice(text.length);

			setText(newText);
			setAutocompleteType(null);
			setAutocompleteQuery("");
			setAutocompleteItems([]);
		},
		[text, parseTrigger],
	);

	const handleSend = useCallback(async () => {
		if ((!text.trim() && attachedFiles.length === 0) || isLoading) return;

		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		onSend(text.trim(), attachedFiles.length > 0 ? attachedFiles : undefined);
		setText("");
		setAttachedFiles([]);
		setAutocompleteType(null);
		setAutocompleteQuery("");
		setAutocompleteItems([]);
		Keyboard.dismiss();
	}, [text, attachedFiles, isLoading, onSend]);

	const closeAutocomplete = useCallback(() => {
		setAutocompleteType(null);
		setAutocompleteQuery("");
		setAutocompleteItems([]);
	}, []);

	const canSend =
		(text.trim().length > 0 || attachedFiles.length > 0) && !isLoading;

	// Match desktop's semi-transparent input background
	const inputBackground = colors.input + "1A"; // ~10% opacity like bg-input/10

	return (
		<View style={styles.container}>
			{autocompleteType && (
				<AutocompleteOverlay
					type={autocompleteType}
					items={autocompleteItems}
					onSelect={handleAutocompleteSelect}
					onClose={closeAutocomplete}
				/>
			)}

			{attachedFiles.length > 0 && (
				<AttachedFilesList files={attachedFiles} onRemove={handleFileRemove} />
			)}

			<View
				style={[
					styles.inputContainer,
					{
						borderColor: permissionColors?.border ?? colors.border,
						backgroundColor: inputBackground,
					},
				]}
			>
				<TextInput
					ref={inputRef}
					value={text}
					onChangeText={handleTextChange}
					onSelectionChange={(e) =>
						setCursorPosition(e.nativeEvent.selection.start)
					}
					placeholder={placeholder}
					placeholderTextColor={`${colors.mutedForeground}80`} // 50% opacity for clearer placeholder distinction
					multiline
					maxLength={10000}
					editable={!isLoading}
					style={[
						styles.textInput,
						typography.body,
						{ color: colors.foreground },
					]}
				/>

				<View style={styles.toolbar}>
					{/* Left: Attachment button (flex-shrink-0) */}
					<View style={styles.toolbarLeftSection}>
						<View style={styles.toolbarButton}>
							<FileAttachmentButton
								onFileAttached={handleFileAttached}
								disabled={isLoading}
							/>
						</View>
					</View>

					{/* Right section: Model + Agent + Send (flex-1) */}
					<View style={styles.toolbarRightSection}>
						{/* Model selector (flex-1 with overflow hidden) */}
						<View style={styles.modelInfoContainer}>
							<Pressable
								onPress={() => {
									if (onModelPress) {
										Haptics.selectionAsync();
										onModelPress();
									}
								}}
								style={({ pressed }) => [
									styles.modelSelector,
									pressed && onModelPress && { opacity: 0.7 },
								]}
								disabled={!onModelPress}
							>
								{modelInfo ? (
									<>
										<ProviderLogo providerId={modelInfo.providerId} />
										<Text
											style={[
												typography.micro,
												{ color: colors.mutedForeground },
											]}
											numberOfLines={1}
										>
											{modelInfo.modelName}
										</Text>
									</>
								) : (
									<Text
										style={[
											typography.micro,
											{ color: colors.mutedForeground },
										]}
										numberOfLines={1}
									>
										Select model
									</Text>
								)}
							</Pressable>
						</View>

						{/* Agent badge (if active) - flex-shrink-0 */}
						{activeAgent && (
							<Pressable
								onPress={() => {
									if (onAgentPress) {
										Haptics.selectionAsync();
										onAgentPress();
									}
								}}
								disabled={!onAgentPress}
								style={styles.agentPressable}
							>
								<AgentBadge name={activeAgent.name} color={activeAgent.color} />
							</Pressable>
						)}

						{/* Send/Stop button (flex-shrink-0) */}
						<Pressable
							onPress={handleSend}
							disabled={!canSend && !isLoading}
							style={({ pressed }) => [
								styles.toolbarButton,
								pressed && canSend && { opacity: 0.7 },
							]}
							hitSlop={8}
						>
							{isLoading ? (
								<StopIcon color={colors.destructive} size={20} />
							) : (
								<SendIcon
									color={canSend ? colors.primary : colors.mutedForeground}
									size={20}
								/>
							)}
						</Pressable>
					</View>
				</View>
			</View>
		</View>
	);
}

// Mobile-optimized spacing constants (matches PWA mobile CSS)
const MOBILE_SPACING = {
	inputBorderRadius: 12, // rounded-xl
	inputPaddingH: 12, // px-3
	inputPaddingV: 10, // py-2.5 - PWA mobile uses symmetric padding
	toolbarPaddingH: 6, // px-1.5 - tighter for mobile
	toolbarPaddingV: 6, // py-1.5
	toolbarButtonSize: 36, // h-9 w-9 - touch-friendly
	toolbarButtonRadius: 8,
	toolbarGap: 6, // gap-x-1.5
	bubbleRadius: 12, // rounded-xl
	agentBadgePaddingH: 6, // px-1.5
	agentBadgePaddingV: 0, // py-0
	agentBadgeRadius: 4, // rounded
};

const styles = StyleSheet.create({
	container: {
		position: "relative",
	},
	inputContainer: {
		borderRadius: MOBILE_SPACING.inputBorderRadius,
		borderWidth: 1,
		overflow: "hidden",
	},
	textInput: {
		minHeight: 52,
		maxHeight: 140,
		paddingHorizontal: MOBILE_SPACING.inputPaddingH,
		paddingVertical: MOBILE_SPACING.inputPaddingV, // symmetric padding for mobile
		textAlignVertical: "top",
	},
	toolbar: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: MOBILE_SPACING.toolbarPaddingH,
		paddingVertical: MOBILE_SPACING.toolbarPaddingV,
		gap: MOBILE_SPACING.toolbarGap,
	},
	toolbarLeftSection: {
		flexShrink: 0,
	},
	toolbarRightSection: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "flex-end",
		gap: MOBILE_SPACING.toolbarGap,
		minWidth: 0,
	},
	toolbarButton: {
		width: MOBILE_SPACING.toolbarButtonSize,
		height: MOBILE_SPACING.toolbarButtonSize,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: MOBILE_SPACING.toolbarButtonRadius,
		flexShrink: 0,
	},
	modelInfoContainer: {
		flex: 1,
		minWidth: 0,
		overflow: "hidden",
		alignItems: "flex-end",
	},
	modelSelector: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		minWidth: 0,
	},
	agentPressable: {
		flexShrink: 0,
	},
	agentBadgeContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	triggerIcon: {
		height: 24,
		width: 24,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 6,
	},
	triggerIconText: {
		fontFamily: Fonts.medium,
		fontSize: FontSizes.uiLabel,
	},
	autocompleteOverlay: {
		position: "absolute",
		bottom: "100%",
		left: 0,
		right: 0,
		marginBottom: 8,
		maxHeight: 280,
		borderRadius: MOBILE_SPACING.inputBorderRadius,
		borderWidth: 1,
		shadowOffset: { width: 0, height: -2 },
		shadowOpacity: 0.08,
		shadowRadius: 12,
		elevation: 8,
	},
	autocompleteHeader: {
		borderBottomWidth: 1,
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	autocompleteItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		paddingHorizontal: 12,
		paddingVertical: 10,
	},
	autocompleteItemContent: {
		flex: 1,
	},
});

export type { ModelInfo, AgentInfo };
