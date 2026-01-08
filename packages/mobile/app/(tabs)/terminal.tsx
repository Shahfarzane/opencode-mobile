import { useCallback, useEffect, useRef, useState } from "react";
import {
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { terminalApi } from "../../src/api";
import { AnsiText } from "../../src/components/terminal/AnsiText";
import { useTerminalStream } from "../../src/hooks/useTerminalStream";
import { useConnectionStore } from "../../src/stores/useConnectionStore";
import { useTerminalStore } from "../../src/stores/useTerminalStore";
import { typography, useTheme } from "../../src/theme";

// PWA-style special keys
const SPECIAL_KEYS = [
	{ label: "Esc", key: "\x1b" },
	{ label: "→", key: "\t" }, // Tab
	{ label: "Ctrl", key: "ctrl" },
	{ label: "⌘", key: "cmd" }, // Cmd modifier
	{ label: "↑", key: "\x1b[A" },
	{ label: "←", key: "\x1b[D" },
	{ label: "↓", key: "\x1b[B" },
	{ label: "→", key: "\x1b[C" },
	{ label: "↩", key: "\n" }, // Enter
];

export default function TerminalScreen() {
	const insets = useSafeAreaInsets();
	const { colors, isDark } = useTheme();
	const { directory, isConnected: isServerConnected } = useConnectionStore();
	const scrollViewRef = useRef<ScrollView>(null);
	const inputRef = useRef<TextInput>(null);

	const [inputValue, setInputValue] = useState("");
	const [ctrlMode, setCtrlMode] = useState(false);
	const [cmdMode, setCmdMode] = useState(false);
	const [isCreatingSession, setIsCreatingSession] = useState(false);
	const [createAttempted, setCreateAttempted] = useState(false);

	const {
		sessionId,
		isConnecting,
		isConnected,
		output,
		error,
		hasExited,
		setSessionId,
		setConnecting,
		setConnected,
		appendOutput,
		clearOutput,
		setError,
		setExited,
		reset,
	} = useTerminalStore();

	const terminalBg = isDark ? "#0D0D0D" : "#1C1B1A";
	const terminalText = "#CECDC3";

	// Truncate directory path like PWA (replace home with ~)
	const truncatedPath = directory
		? directory.replace(/^\/Users\/[^/]+/, "~").replace(/^\/home\/[^/]+/, "~")
		: "";

	const handleData = useCallback(
		(data: string) => {
			appendOutput(data);
		},
		[appendOutput],
	);

	const handleConnected = useCallback(() => {
		setConnected(true);
		setError(null);
	}, [setConnected, setError]);

	const handleExit = useCallback(
		(exitCode: number, signal: number | null) => {
			setExited(exitCode);
			appendOutput(
				`\n\r[Process exited with code ${exitCode}${signal ? `, signal ${signal}` : ""}]\n\r`,
			);
		},
		[setExited, appendOutput],
	);

	const handleError = useCallback(
		(err: Error) => {
			setError(err.message);
			setConnected(false);
		},
		[setError, setConnected],
	);

	const handleReconnecting = useCallback(
		(attempt: number, maxAttempts: number) => {
			appendOutput(
				`\n\r[Reconnecting... attempt ${attempt}/${maxAttempts}]\n\r`,
			);
		},
		[appendOutput],
	);

	useTerminalStream({
		sessionId,
		onData: handleData,
		onConnected: handleConnected,
		onExit: handleExit,
		onError: handleError,
		onReconnecting: handleReconnecting,
	});

	const createSession = useCallback(async () => {
		if (!directory || isCreatingSession) return;

		setIsCreatingSession(true);
		setCreateAttempted(true);
		setConnecting(true);
		setError(null);
		clearOutput();

		try {
			const session = await terminalApi.createSession({
				cwd: directory,
				cols: 80,
				rows: 24,
			});
			setSessionId(session.sessionId);
			// Don't add startup message - PWA style shows clean terminal
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: "Failed to create terminal session";
			setError(message);
			appendOutput(`[Error: ${message}]\n\r`);
		} finally {
			setIsCreatingSession(false);
			setConnecting(false);
		}
	}, [
		directory,
		isCreatingSession,
		setConnecting,
		setError,
		clearOutput,
		setSessionId,
		appendOutput,
	]);

	const closeSession = useCallback(async () => {
		if (sessionId) {
			await terminalApi.closeSession(sessionId).catch(() => {});
		}
		reset();
		setCreateAttempted(false);
	}, [sessionId, reset]);

	const restartSession = useCallback(async () => {
		await closeSession();
		await createSession();
	}, [closeSession, createSession]);

	const sendInput = useCallback(
		async (data: string) => {
			if (!sessionId || !isConnected) return;

			try {
				await terminalApi.sendInput(sessionId, data);
			} catch (err) {
				console.error("Failed to send input:", err);
			}
		},
		[sessionId, isConnected],
	);

	const handleSubmit = useCallback(() => {
		if (!inputValue.trim() && !inputValue) return;
		sendInput(inputValue + "\n");
		setInputValue("");
	}, [inputValue, sendInput]);

	const handleSpecialKey = useCallback(
		(key: string) => {
			if (key === "ctrl") {
				setCtrlMode(!ctrlMode);
				setCmdMode(false);
				return;
			}

			if (key === "cmd") {
				setCmdMode(!cmdMode);
				setCtrlMode(false);
				return;
			}

			if (ctrlMode && key.length === 1) {
				const ctrlChar = String.fromCharCode(
					key.toUpperCase().charCodeAt(0) - 64,
				);
				sendInput(ctrlChar);
				setCtrlMode(false);
			} else {
				sendInput(key);
			}
			setCmdMode(false);
		},
		[ctrlMode, cmdMode, sendInput],
	);

	const handleCharInput = useCallback(
		(char: string) => {
			if (ctrlMode && char.length === 1 && /[a-zA-Z]/.test(char)) {
				const ctrlChar = String.fromCharCode(
					char.toUpperCase().charCodeAt(0) - 64,
				);
				sendInput(ctrlChar);
				setCtrlMode(false);
				setInputValue("");
			}
		},
		[ctrlMode, sendInput],
	);

	useEffect(() => {
		if (output) {
			setTimeout(() => {
				scrollViewRef.current?.scrollToEnd({ animated: true });
			}, 50);
		}
	}, [output]);

	useEffect(() => {
		if (
			isServerConnected &&
			directory &&
			!sessionId &&
			!isCreatingSession &&
			!hasExited &&
			!createAttempted
		) {
			createSession();
		}
	}, [
		isServerConnected,
		directory,
		sessionId,
		isCreatingSession,
		hasExited,
		createAttempted,
		createSession,
	]);

	useEffect(() => {
		return () => {
			if (sessionId) {
				terminalApi.closeSession(sessionId).catch(() => {});
			}
		};
	}, [sessionId]);

	const HEADER_HEIGHT = 52;
	const keyboardOffset = HEADER_HEIGHT + insets.top;

	const renderContent = () => {
		if (!isServerConnected) {
			return (
				<View style={styles.centerContainer}>
					<Text
						style={[
							typography.uiLabel,
							{ color: colors.foreground, textAlign: "center" },
						]}
					>
						Not connected to server
					</Text>
					<Text
						style={[
							typography.meta,
							{
								color: colors.mutedForeground,
								textAlign: "center",
								marginTop: 8,
							},
						]}
					>
						Connect to a server to use the terminal
					</Text>
				</View>
			);
		}

		if (!directory) {
			return (
				<View style={styles.centerContainer}>
					<Text
						style={[
							typography.uiLabel,
							{ color: colors.foreground, textAlign: "center" },
						]}
					>
						No directory selected
					</Text>
					<Text
						style={[
							typography.meta,
							{
								color: colors.mutedForeground,
								textAlign: "center",
								marginTop: 8,
							},
						]}
					>
						Select a directory to start a terminal session
					</Text>
				</View>
			);
		}

		if (isCreatingSession || (isConnecting && !sessionId)) {
			return (
				<View style={styles.centerContainer}>
					<ActivityIndicator size="large" color={colors.primary} />
					<Text
						style={[
							typography.meta,
							{ color: colors.mutedForeground, marginTop: 12 },
						]}
					>
						Starting terminal...
					</Text>
				</View>
			);
		}

		if (error && !sessionId) {
			return (
				<View style={styles.centerContainer}>
					<Text
						style={[
							typography.uiLabel,
							{ color: colors.destructive, textAlign: "center" },
						]}
					>
						Failed to start terminal
					</Text>
					<Text
						style={[
							typography.meta,
							{
								color: colors.mutedForeground,
								textAlign: "center",
								marginTop: 8,
								marginBottom: 16,
							},
						]}
					>
						{error}
					</Text>
					<Pressable
						onPress={() => {
							setCreateAttempted(false);
							setError(null);
						}}
						style={[styles.retryButton, { backgroundColor: colors.primary }]}
					>
						<Text
							style={[typography.uiLabel, { color: colors.primaryForeground }]}
						>
							Retry
						</Text>
					</Pressable>
				</View>
			);
		}

		return null; // Terminal content rendered separately with header
	};

	// Show non-terminal states (not connected, no directory, loading, error)
	const nonTerminalContent = renderContent();
	if (nonTerminalContent) {
		return (
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				style={[styles.container, { backgroundColor: colors.background }]}
				keyboardVerticalOffset={keyboardOffset}
			>
				{nonTerminalContent}
			</KeyboardAvoidingView>
		);
	}

	// PWA-style terminal layout
	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			style={[styles.container, { backgroundColor: colors.background }]}
			keyboardVerticalOffset={keyboardOffset}
		>
			{/* Header Bar - PWA style */}
			<View
				style={[
					styles.headerBar,
					{ backgroundColor: colors.card, borderBottomColor: colors.border },
				]}
			>
				<View style={styles.headerLeft}>
					<Text
						style={[typography.code, { color: colors.foreground }]}
						numberOfLines={1}
						ellipsizeMode="middle"
					>
						{truncatedPath}
					</Text>
					{isConnected && !hasExited && (
						<View style={[styles.statusDot, { backgroundColor: colors.success }]} />
					)}
					{hasExited && (
						<Text style={[typography.micro, { color: colors.mutedForeground }]}>
							exited
						</Text>
					)}
				</View>
				<View style={styles.headerActions}>
					<Pressable
						onPress={clearOutput}
						style={[styles.headerButton, { backgroundColor: "#f97316" }]}
					>
						<Text style={[typography.micro, { color: "#fff", fontWeight: "600" }]}>
							Clear
						</Text>
					</Pressable>
					<Pressable
						onPress={restartSession}
						style={[styles.headerButton, { backgroundColor: "#f97316" }]}
					>
						<Text style={[typography.micro, { color: "#fff", fontWeight: "600" }]}>
							Restart
						</Text>
					</Pressable>
				</View>
			</View>

			{/* Special Keys Row - PWA style, above terminal */}
			<View
				style={[
					styles.specialKeysRow,
					{ backgroundColor: colors.card, borderBottomColor: colors.border },
				]}
			>
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.specialKeysContent}
				>
					{SPECIAL_KEYS.map((item, index) => {
						const isActive =
							(item.key === "ctrl" && ctrlMode) ||
							(item.key === "cmd" && cmdMode);
						return (
							<Pressable
								key={`${item.label}-${index}`}
								onPress={() => handleSpecialKey(item.key)}
								style={[
									styles.specialKey,
									{
										backgroundColor: isActive
											? colors.primary
											: colors.muted,
										borderColor: isActive
											? colors.primary
											: colors.border,
									},
								]}
							>
								<Text
									style={[
										typography.micro,
										{
											color: isActive
												? colors.primaryForeground
												: colors.foreground,
											fontWeight: "500",
										},
									]}
								>
									{item.label}
								</Text>
							</Pressable>
						);
					})}
				</ScrollView>
			</View>

			{/* Terminal Output */}
			<View style={styles.terminalContainer}>
				<ScrollView
					ref={scrollViewRef}
					style={[styles.terminalOutput, { backgroundColor: terminalBg }]}
					contentContainerStyle={styles.terminalContent}
				>
					<AnsiText
						text={output || ""}
						style={[typography.code, styles.terminalText]}
						baseColor={terminalText}
					/>
				</ScrollView>

				{error && (
					<View
						style={[
							styles.errorBanner,
							{
								backgroundColor: `${colors.destructive}20`,
								borderTopColor: colors.destructive,
							},
						]}
					>
						<Text style={[typography.code, { color: colors.destructive }]}>
							{error}
						</Text>
					</View>
				)}
			</View>

			{/* Input Bar - simplified for mobile */}
			<View
				style={[
					styles.inputArea,
					{
						borderTopColor: colors.border,
						backgroundColor: colors.background,
						paddingBottom: Math.max(insets.bottom, 8),
					},
				]}
			>
				<View
					style={[
						styles.inputWrapper,
						{ backgroundColor: terminalBg, borderColor: colors.border },
					]}
				>
					<Text style={[typography.uiLabel, { color: colors.success }]}>$</Text>
					<TextInput
						ref={inputRef}
						value={inputValue}
						onChangeText={(text) => {
							setInputValue(text);
							if (text.length > inputValue.length) {
								handleCharInput(text.slice(-1));
							}
						}}
						onSubmitEditing={handleSubmit}
						placeholder={hasExited ? "Session ended" : "Enter command..."}
						placeholderTextColor={colors.mutedForeground}
						editable={!hasExited && isConnected}
						autoCapitalize="none"
						autoCorrect={false}
						returnKeyType="send"
						blurOnSubmit={false}
						style={[styles.textInput, typography.body, { color: terminalText }]}
					/>
				</View>
				<Pressable
					onPress={handleSubmit}
					disabled={hasExited || !isConnected}
					style={[
						styles.sendButton,
						{
							backgroundColor:
								hasExited || !isConnected ? colors.muted : colors.primary,
						},
					]}
				>
					<Text
						style={[
							typography.uiLabel,
							{ color: colors.primaryForeground, fontWeight: "700" },
						]}
					>
						{">"}
					</Text>
				</Pressable>
			</View>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	centerContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: 20,
	},
	retryButton: {
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 8,
	},
	// PWA-style header bar
	headerBar: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderBottomWidth: 1,
	},
	headerLeft: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	headerActions: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	headerButton: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 6,
	},
	statusDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
	},
	// Special keys row - PWA style
	specialKeysRow: {
		borderBottomWidth: 1,
	},
	specialKeysContent: {
		paddingHorizontal: 8,
		paddingVertical: 8,
		gap: 6,
		flexDirection: "row",
	},
	specialKey: {
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 6,
		borderWidth: 1,
		minWidth: 32,
		alignItems: "center",
	},
	// Terminal content
	terminalContainer: {
		flex: 1,
	},
	terminalOutput: {
		flex: 1,
	},
	terminalContent: {
		padding: 8,
		paddingBottom: 20,
	},
	terminalText: {
		lineHeight: 16,
	},
	errorBanner: {
		padding: 8,
		borderTopWidth: 1,
	},
	// Input area
	inputArea: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 8,
		paddingTop: 8,
		gap: 8,
		borderTopWidth: 1,
	},
	inputWrapper: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		borderRadius: 8,
		borderWidth: 1,
		paddingHorizontal: 12,
	},
	textInput: {
		flex: 1,
		paddingVertical: 12,
		paddingHorizontal: 8,
	},
	sendButton: {
		width: 44,
		height: 44,
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
	},
});
