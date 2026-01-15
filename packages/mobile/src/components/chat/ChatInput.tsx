import { FlashList } from "@shopify/flash-list";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	Animated,
	Keyboard,
	Pressable,
	Text,
	TextInput,
	View,
} from "react-native";
import { AiAgentIcon, SendIcon, StopIcon } from "@/components/icons";
import { IconButton } from "@/components/ui";
import { ProviderLogo } from "@/components/ui/ProviderLogo";
import {
	FontSizes,
	Fonts,
	fontStyle,
	Spacing,
	typography,
	useTheme,
} from "@/theme";
import { OPACITY, withOpacity } from "@/utils/colors";
import { chatInputStyles, MOBILE_SPACING } from "./ChatInput.styles";
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
	/** Whether a session is currently active (for placeholder text) */
	hasActiveSession?: boolean;
}

function AgentIcon() {
	const { colors } = useTheme();
	return (
		<View
			className={chatInputStyles.triggerIcon({})}
			style={{ backgroundColor: withOpacity(colors.info, OPACITY.light) }}
		>
			<Text
				style={{
					fontFamily: Fonts.medium,
					fontSize: FontSizes.micro,
					color: colors.info,
				}}
			>
				#
			</Text>
		</View>
	);
}

function CommandIcon() {
	const { colors } = useTheme();
	return (
		<View
			className={chatInputStyles.triggerIcon({})}
			style={{ backgroundColor: withOpacity(colors.warning, OPACITY.light) }}
		>
			<Text
				style={{
					fontFamily: Fonts.medium,
					fontSize: FontSizes.micro,
					color: colors.warning,
				}}
			>
				/
			</Text>
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
			className={chatInputStyles.triggerIcon({})}
			style={{
				backgroundColor: withOpacity(colors.mutedForeground, OPACITY.light),
			}}
		>
			<Text
				style={{
					fontFamily: Fonts.medium,
					fontSize: FontSizes.micro,
					color: getColor(),
				}}
			>
				@
			</Text>
		</View>
	);
}

function AutocompleteOverlay({
	type: _type,
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
				// Match PWA: flex items-start gap-2 px-3 py-2
				style={({ pressed }) => ({
					flexDirection: "row",
					alignItems: "flex-start",
					gap: Spacing[2], // gap-2 = 8px
					paddingHorizontal: Spacing[3], // px-3 = 12px
					paddingVertical: Spacing[2], // py-2 = 8px
					backgroundColor: pressed ? colors.muted : undefined,
				})}
			>
				{/* Match PWA: mt-0.5 for icon */}
				<View style={{ marginTop: Spacing[0.5] }}>
					{item.type === "agent" && <AgentIcon />}
					{item.type === "command" && <CommandIcon />}
					{item.type === "file" && <FileIcon extension={item.extension} />}
				</View>
				<View style={{ flex: 1, minWidth: 0 }}>
					{/* Match PWA: typography-ui-label font-medium */}
					<Text
						style={[
							typography.uiLabel,
							fontStyle("500"),
							{ color: colors.foreground },
						]}
					>
						{item.type === "agent" && `#${item.name}`}
						{item.type === "command" && `/${item.name}`}
						{item.type === "file" && `@${item.name}`}
					</Text>
					{/* Match PWA: typography-meta text-muted-foreground mt-0.5 truncate */}
					{"description" in item && item.description && (
						<Text
							style={[
								typography.meta,
								{ color: colors.mutedForeground, marginTop: Spacing[0.5] },
							]}
							numberOfLines={1}
						>
							{item.description}
						</Text>
					)}
					{item.type === "file" && (
						<Text
							style={[
								typography.meta,
								{ color: colors.mutedForeground, marginTop: Spacing[0.5] },
							]}
							numberOfLines={1}
						>
							{item.path}
						</Text>
					)}
				</View>
			</Pressable>
		),
		[onSelect, colors.foreground, colors.mutedForeground, colors.muted],
	);

	if (items.length === 0) {
		return null;
	}

	// Match PWA styling exactly:
	// Items: py-2 (8px*2) + name (~16px) + description (~14px + 2px gap) = ~48px with description, ~36px without
	// Footer: pt-1 (4px) + pb-1.5 (6px) + text (~12px) = ~22px
	const AUTOCOMPLETE_ITEM_HEIGHT = 48; // Account for description
	const AUTOCOMPLETE_FOOTER_HEIGHT = 22;
	const AUTOCOMPLETE_MAX_ITEMS = 5; // Match PWA max-h-64 (~256px)
	const AUTOCOMPLETE_MAX_HEIGHT = 280; // Slightly larger for proper spacing
	const contentHeight =
		Math.min(items.length, AUTOCOMPLETE_MAX_ITEMS) * AUTOCOMPLETE_ITEM_HEIGHT +
		AUTOCOMPLETE_FOOTER_HEIGHT;

	return (
		<Animated.View
			style={{
				// Position above input
				position: "absolute",
				bottom: "100%",
				left: 0,
				right: 0,
				// Match PWA: mb-2 = 8px margin
				marginBottom: Spacing[2],
				// Match PWA: rounded-xl = 12px (same as chat input)
				borderRadius: MOBILE_SPACING.bubbleRadius,
				overflow: "hidden",
				// Match PWA: border border-border
				borderColor: colors.border,
				borderWidth: 1,
				backgroundColor: colors.background,
				// Subtle shadow (PWA uses shadow-none but we need some depth on mobile)
				shadowColor: colors.foreground,
				shadowOffset: { width: 0, height: 2 },
				shadowOpacity: 0.05,
				shadowRadius: 6,
				elevation: 3,
				zIndex: 100,
				// Animation
				opacity: fadeAnim,
				transform: [{ translateY: slideAnim }],
				// Fixed height based on content
				height: contentHeight,
				maxHeight: AUTOCOMPLETE_MAX_HEIGHT,
			}}
		>
			<View style={{ flex: 1 }}>
				<FlashList
					data={items}
					renderItem={renderItem}
					keyExtractor={(item) =>
						item.type === "file" ? item.path : `${item.type}-${item.name}`
					}
					keyboardShouldPersistTaps="handled"
					estimatedItemSize={AUTOCOMPLETE_ITEM_HEIGHT}
					initialNumToRender={8}
					maxToRenderPerBatch={8}
					updateCellsBatchingPeriod={50}
				/>
			</View>
			{/* Match PWA footer: px-3 pt-1 pb-1.5 border-t */}
			<View
				style={{
					borderTopColor: colors.border,
					borderTopWidth: 1,
					paddingHorizontal: Spacing[3], // px-3 = 12px
					paddingTop: Spacing[1], // pt-1 = 4px
					paddingBottom: Spacing[1.5], // pb-1.5 = 6px
				}}
			>
				<Text style={[typography.micro, { color: colors.mutedForeground }]}>
					↑↓ navigate • Enter select • Esc close
				</Text>
			</View>
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
		<View className={chatInputStyles.agentBadgeContainer({})}>
			<AiAgentIcon size={14} color={badgeColor} />
			<Text style={[typography.micro, fontStyle("500"), { color: badgeColor }]}>
				{capitalizedName}
			</Text>
		</View>
	);
}

// Default placeholder text matching PWA desktop
const DEFAULT_PLACEHOLDER_ACTIVE = "# for agents; @ for files; / for commands";
const DEFAULT_PLACEHOLDER_INACTIVE =
	"Select or create a session to start chatting";

export function ChatInput({
	onSend,
	isLoading = false,
	placeholder,
	agents = [],
	commands = [],
	onFileSearch,
	permissionMode,
	modelInfo,
	activeAgent,
	onModelPress,
	onAgentPress,
	hasActiveSession = true,
}: ChatInputProps) {
	// Use custom placeholder if provided, otherwise use conditional defaults
	const inputPlaceholder =
		placeholder ??
		(hasActiveSession
			? DEFAULT_PLACEHOLDER_ACTIVE
			: DEFAULT_PLACEHOLDER_INACTIVE);
	const { colors, isDark } = useTheme();
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

	const handleModelPress = useCallback(() => {
		if (!onModelPress) return;
		Haptics.selectionAsync();
		onModelPress();
	}, [onModelPress]);

	// Match desktop's semi-transparent input background
	// PWA: bg-input/10 dark:bg-input/30 (10% in light, 30% in dark)
	const inputBackground = withOpacity(
		colors.input,
		isDark ? OPACITY.overlay : OPACITY.selected,
	);

	return (
		<View className={chatInputStyles.container({})}>
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
				className={chatInputStyles.inputContainer({})}
				style={{
					borderColor: permissionColors?.border ?? colors.border,
					borderWidth: 1,
					backgroundColor: inputBackground,
				}}
			>
				<TextInput
					ref={inputRef}
					value={text}
					onChangeText={handleTextChange}
					onSelectionChange={(e) =>
						setCursorPosition(e.nativeEvent.selection.start)
					}
					placeholder={inputPlaceholder}
					placeholderTextColor={colors.mutedForeground}
					multiline
					maxLength={10000}
					editable={!isLoading && hasActiveSession}
					className={chatInputStyles.textInput({})}
					style={[
						typography.body,
						{ color: colors.foreground, textAlignVertical: "top" },
					]}
				/>

				<View className={chatInputStyles.toolbar({})}>
					<View className={chatInputStyles.toolbarLeftSection({})}>
						<View className={chatInputStyles.toolbarButton({})}>
							<FileAttachmentButton
								onFileAttached={handleFileAttached}
								disabled={isLoading}
							/>
						</View>
					</View>

					{/* Right section: Model + Agent + Send (flex-1) */}
					<View className={chatInputStyles.toolbarRightSection({})}>
						{/* Model selector (flex-1 with overflow hidden) */}
						<View className={chatInputStyles.modelInfoContainer({})}
						>
							<Pressable
								onPress={handleModelPress}
								className={chatInputStyles.modelSelector({})}
								style={({ pressed }) =>
									pressed && onModelPress ? { opacity: 0.7 } : undefined
								}
								disabled={!onModelPress}
							>
								{modelInfo ? (
									<>
										<ProviderLogo providerId={modelInfo.providerId} size={14} />
										<Text
											style={[
												typography.micro,
												fontStyle("500"),
												{ color: colors.foreground, flexShrink: 1 },
											]}
											numberOfLines={1}
											ellipsizeMode="tail"
										>
											{modelInfo.modelName}
										</Text>
									</>
								) : (
									<Text
										style={[
											typography.micro,
											fontStyle("500"),
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
								className={chatInputStyles.agentPressable({})}
							>
								<AgentBadge name={activeAgent.name} color={activeAgent.color} />
							</Pressable>
						)}

						{/* Send/Stop button (flex-shrink-0) */}
						<IconButton
							icon={
								isLoading ? (
									<StopIcon color={colors.destructive} size={20} />
								) : (
									<SendIcon
										color={canSend ? colors.primary : colors.mutedForeground}
										size={20}
									/>
								)
							}
							variant="ghost"
							size="icon-md"
							onPress={handleSend}
							isDisabled={!canSend && !isLoading}
							accessibilityLabel={isLoading ? "Stop" : "Send message"}
						/>
					</View>
				</View>
			</View>
		</View>
	);
}

export type { ModelInfo, AgentInfo };
