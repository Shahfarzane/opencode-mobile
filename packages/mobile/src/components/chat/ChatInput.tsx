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
import { typography, useTheme } from "@/theme";

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

interface ChatInputProps {
	onSend: (message: string) => void;
	isLoading?: boolean;
	placeholder?: string;
	agents?: Array<{ name: string; description?: string }>;
	commands?: Array<{ name: string; description?: string }>;
	onFileSearch?: (
		query: string,
	) => Promise<Array<{ name: string; path: string; extension?: string }>>;
	permissionMode?: EditPermissionMode;
}

function AddIcon({ color, size = 20 }: { color: string; size?: number }) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Path
				d="M12 8v8M8 12h8"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Path
				d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
				stroke={color}
				strokeWidth={2}
			/>
		</Svg>
	);
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
						{ color: colors.mutedForeground, fontWeight: "600" },
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

export function ChatInput({
	onSend,
	isLoading = false,
	placeholder = "# for agents; @ for files; / for commands",
	agents = [],
	commands = [],
	onFileSearch,
	permissionMode,
}: ChatInputProps) {
	const { colors, isDark } = useTheme();
	const permissionColors = getPermissionModeColors(permissionMode, colors);
	const inputRef = useRef<TextInput>(null);

	const [text, setText] = useState("");
	const [autocompleteType, setAutocompleteType] =
		useState<AutocompleteType>(null);
	const [autocompleteQuery, setAutocompleteQuery] = useState("");
	const [autocompleteItems, setAutocompleteItems] = useState<
		AutocompleteItem[]
	>([]);
	const [, setCursorPosition] = useState(0);

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
		if (!text.trim() || isLoading) return;

		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		onSend(text.trim());
		setText("");
		setAutocompleteType(null);
		setAutocompleteQuery("");
		setAutocompleteItems([]);
		Keyboard.dismiss();
	}, [text, isLoading, onSend]);

	const closeAutocomplete = useCallback(() => {
		setAutocompleteType(null);
		setAutocompleteQuery("");
		setAutocompleteItems([]);
	}, []);

	const canSend = text.trim().length > 0 && !isLoading;

	// Background colors matching desktop: bg-input/10 light, bg-input/30 dark
	const inputBackground = isDark
		? `${colors.input}4D` // ~30% opacity
		: `${colors.input}1A`; // ~10% opacity

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
					placeholderTextColor={colors.mutedForeground}
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
					{/* Left: Attachment button */}
					<Pressable
						style={({ pressed }) => [
							styles.toolbarButton,
							pressed && { backgroundColor: `${colors.foreground}10` },
						]}
						hitSlop={8}
					>
						<AddIcon color={colors.mutedForeground} size={20} />
					</Pressable>

					{/* Center: Model info */}
					<View style={styles.modelInfo}>
						<Text
							style={[typography.micro, { color: colors.mutedForeground }]}
							numberOfLines={1}
						>
							Sonnet
						</Text>
						<View
							style={[
								styles.modelDot,
								{ backgroundColor: colors.mutedForeground },
							]}
						/>
						<Text
							style={[typography.micro, { color: colors.mutedForeground }]}
							numberOfLines={1}
						>
							Anthropic
						</Text>
					</View>

					{/* Right: Send/Stop button */}
					<Pressable
						onPress={handleSend}
						disabled={!canSend && !isLoading}
						style={({ pressed }) => [
							styles.toolbarButton,
							styles.sendButton,
							canSend && { backgroundColor: `${colors.primary}15` },
							pressed && canSend && { backgroundColor: `${colors.primary}25` },
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
	);
}

const styles = StyleSheet.create({
	container: {
		position: "relative",
	},
	inputContainer: {
		borderRadius: 16,
		borderWidth: 1,
		overflow: "hidden",
	},
	textInput: {
		minHeight: 52,
		maxHeight: 140,
		paddingHorizontal: 16,
		paddingTop: 14,
		paddingBottom: 14,
		textAlignVertical: "top",
	},
	toolbar: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 8,
		paddingVertical: 8,
		gap: 4,
	},
	toolbarButton: {
		width: 40,
		height: 40,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 10,
	},
	sendButton: {
		// Additional styling for send button
	},
	modelInfo: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 6,
	},
	modelDot: {
		width: 3,
		height: 3,
		borderRadius: 2,
	},
	triggerIcon: {
		height: 28,
		width: 28,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 8,
	},
	triggerIconText: {
		fontFamily: "IBMPlexMono-Medium",
		fontSize: 15,
	},
	autocompleteOverlay: {
		position: "absolute",
		bottom: "100%",
		left: 0,
		right: 0,
		marginBottom: 8,
		maxHeight: 280,
		borderRadius: 14,
		borderWidth: 1,
		shadowOffset: { width: 0, height: -2 },
		shadowOpacity: 0.08,
		shadowRadius: 12,
		elevation: 8,
	},
	autocompleteHeader: {
		borderBottomWidth: 1,
		paddingHorizontal: 14,
		paddingVertical: 10,
	},
	autocompleteItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingHorizontal: 14,
		paddingVertical: 12,
	},
	autocompleteItemContent: {
		flex: 1,
	},
});
