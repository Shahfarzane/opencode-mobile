import { FlashList } from "@shopify/flash-list";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	Animated,
	Keyboard,
	Pressable,
	Text,
	TextInput,
	useColorScheme,
	View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

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

interface ChatInputProps {
	onSend: (message: string) => void;
	isLoading?: boolean;
	placeholder?: string;
	agents?: Array<{ name: string; description?: string }>;
	commands?: Array<{ name: string; description?: string }>;
	onFileSearch?: (
		query: string,
	) => Promise<Array<{ name: string; path: string; extension?: string }>>;
}

function SendIcon({ color }: { color: string }) {
	return (
		<Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
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

function AgentIcon() {
	return (
		<View className="h-5 w-5 items-center justify-center rounded bg-info/20">
			<Text className="font-mono text-xs text-info">#</Text>
		</View>
	);
}

function CommandIcon() {
	return (
		<View className="h-5 w-5 items-center justify-center rounded bg-warning/20">
			<Text className="font-mono text-xs text-warning">/</Text>
		</View>
	);
}

function FileIcon({ extension }: { extension?: string }) {
	const getColor = () => {
		switch (extension?.toLowerCase()) {
			case "ts":
			case "tsx":
			case "js":
			case "jsx":
				return "text-blue-500";
			case "json":
				return "text-yellow-500";
			case "md":
			case "mdx":
				return "text-gray-500";
			case "png":
			case "jpg":
			case "jpeg":
			case "gif":
			case "svg":
				return "text-green-500";
			default:
				return "text-muted-foreground";
		}
	};

	return (
		<View className="h-5 w-5 items-center justify-center rounded bg-muted">
			<Text className={`font-mono text-xs ${getColor()}`}>@</Text>
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

	useEffect(() => {
		Animated.timing(fadeAnim, {
			toValue: 1,
			duration: 150,
			useNativeDriver: true,
		}).start();
	}, [fadeAnim]);

	const renderItem = useCallback(
		({ item }: { item: AutocompleteItem }) => (
			<Pressable
				onPress={() => {
					Haptics.selectionAsync();
					onSelect(item);
				}}
				className="flex-row items-center gap-3 px-4 py-3 active:bg-muted"
			>
				{item.type === "agent" && <AgentIcon />}
				{item.type === "command" && <CommandIcon />}
				{item.type === "file" && <FileIcon extension={item.extension} />}
				<View className="flex-1">
					<Text className="font-mono text-sm text-foreground">
						{item.type === "agent" && `#${item.name}`}
						{item.type === "command" && `/${item.name}`}
						{item.type === "file" && `@${item.name}`}
					</Text>
					{"description" in item && item.description && (
						<Text
							className="font-mono text-xs text-muted-foreground"
							numberOfLines={1}
						>
							{item.description}
						</Text>
					)}
					{item.type === "file" && (
						<Text
							className="font-mono text-xs text-muted-foreground"
							numberOfLines={1}
						>
							{item.path}
						</Text>
					)}
				</View>
			</Pressable>
		),
		[onSelect],
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
			style={{ opacity: fadeAnim }}
			className="absolute bottom-full left-0 right-0 mb-2 max-h-64 rounded-2xl border border-border bg-background"
		>
			<View className="border-b border-border px-4 py-2">
				<Text className="font-mono text-xs font-medium text-muted-foreground">
					{getTitle()}
				</Text>
			</View>
			<FlashList
				data={items}
				renderItem={renderItem}
				keyExtractor={(item) =>
					item.type === "file" ? item.path : `${item.type}-${item.name}`
				}
				estimatedItemSize={56}
				keyboardShouldPersistTaps="handled"
			/>
		</Animated.View>
	);
}

export function ChatInput({
	onSend,
	isLoading = false,
	placeholder = "Ask anything...",
	agents = [],
	commands = [],
	onFileSearch,
}: ChatInputProps) {
	const colorScheme = useColorScheme();
	const isDark = colorScheme === "dark";
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

	const handleTextChange = useCallback(
		(newText: string) => {
			setText(newText);

			const trigger = parseTrigger(newText, newText.length);

			if (trigger) {
				setAutocompleteType(trigger.type);
				setAutocompleteQuery(trigger.query);
			} else {
				setAutocompleteType(null);
				setAutocompleteQuery("");
				setAutocompleteItems([]);
			}
		},
		[parseTrigger],
	);

	const filteredAgents = useMemo((): AutocompleteItem[] => {
		if (autocompleteType !== "agent") return [];

		const query = autocompleteQuery.toLowerCase();
		return agents
			.filter((agent) => agent.name.toLowerCase().includes(query))
			.slice(0, 10)
			.map((agent) => ({
				type: "agent" as const,
				name: agent.name,
				description: agent.description,
			}));
	}, [agents, autocompleteType, autocompleteQuery]);

	const filteredCommands = useMemo((): AutocompleteItem[] => {
		if (autocompleteType !== "command") return [];

		const query = autocompleteQuery.toLowerCase();
		const builtInCommands = [
			{ name: "init", description: "Create/update AGENTS.md file" },
			{ name: "summarize", description: "Generate a summary of the session" },
		];

		const allCommands = [...builtInCommands, ...commands];
		return allCommands
			.filter((cmd) => cmd.name.toLowerCase().includes(query))
			.slice(0, 10)
			.map((cmd) => ({
				type: "command" as const,
				name: cmd.name,
				description: cmd.description,
			}));
	}, [commands, autocompleteType, autocompleteQuery]);

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

	useEffect(() => {
		if (autocompleteType === "agent") {
			setAutocompleteItems(filteredAgents);
		} else if (autocompleteType === "command") {
			setAutocompleteItems(filteredCommands);
		}
	}, [autocompleteType, filteredAgents, filteredCommands]);

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

	return (
		<View className="relative">
			{autocompleteType && (
				<AutocompleteOverlay
					type={autocompleteType}
					items={autocompleteItems}
					onSelect={handleAutocompleteSelect}
					onClose={closeAutocomplete}
				/>
			)}

			<View className="flex-row items-end gap-2">
				<TextInput
					ref={inputRef}
					value={text}
					onChangeText={handleTextChange}
					onSelectionChange={(e) =>
						setCursorPosition(e.nativeEvent.selection.start)
					}
					placeholder={placeholder}
					placeholderTextColor={isDark ? "#878580" : "#6F6E69"}
					multiline
					maxLength={10000}
					editable={!isLoading}
					className="min-h-[44px] max-h-32 flex-1 rounded-2xl border border-border bg-input px-4 py-3 font-mono text-base text-foreground"
					style={{ textAlignVertical: "center" }}
				/>
				<Pressable
					onPress={handleSend}
					disabled={!canSend}
					className="h-11 w-11 items-center justify-center rounded-full bg-primary active:opacity-80 disabled:opacity-50"
				>
					<SendIcon color="#FFFCF0" />
				</Pressable>
			</View>

			<View className="mt-2 flex-row flex-wrap gap-2">
				<Text className="font-mono text-xs text-muted-foreground">
					<Text className="text-info">#</Text> agent
				</Text>
				<Text className="font-mono text-xs text-muted-foreground">
					<Text className="text-warning">/</Text> command
				</Text>
				<Text className="font-mono text-xs text-muted-foreground">
					<Text className="text-foreground">@</Text> file
				</Text>
			</View>
		</View>
	);
}
