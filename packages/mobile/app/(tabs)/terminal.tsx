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
import { Button } from "../../src/components/ui";
import { useTerminalStream } from "../../src/hooks/useTerminalStream";
import { useConnectionStore } from "../../src/stores/useConnectionStore";
import { useTerminalStore } from "../../src/stores/useTerminalStore";
import { Radius, Spacing, fontStyle, typography, useTheme } from "../../src/theme";

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
	const { colors } = useTheme();
	const { directory, isConnected: isServerConnected } = useConnectionStore();
	const scrollViewRef = useRef<ScrollView>(null);
	const inputRef = useRef<TextInput>(null);
	const inputValueRef = useRef<string>("");

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

	const terminalBg = colors.syntaxBackground;
	const terminalText = colors.syntaxForeground;

	// Truncate directory path like PWA (replace home with ~)
	const truncatedPath = directory
		? directory.replace(/^\/Users\/[^/]+/, "~").replace(/^\/home\/[^/]+/, "~")
		: "";

	const handleData = useCallback(
		(data: string) => {
			// Filter out the duplicate first character pattern from zsh
			// Pattern: char + backspace (\x08) + same char (zsh line editor echo)
			let filteredData = data;
			if (data.length >= 3 && data.charCodeAt(1) === 0x08) {
				const firstChar = data.charAt(0);
				const thirdChar = data.charAt(2);
				if (firstChar === thirdChar) {
					filteredData = data.slice(2);
				}
			}
			appendOutput(filteredData);
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


	const handleSpecialKey = useCallback(
		(key: string) => {
			if (key === "ctrl") {
				setCtrlMode((prev) => !prev);
				setCmdMode(false);
				return;
			}

			if (key === "cmd") {
				setCmdMode((prev) => !prev);
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

	// Focus input when terminal becomes connected
	useEffect(() => {
		if (isConnected && !hasExited) {
			// Small delay to ensure the input is ready
			const timer = setTimeout(() => {
				inputRef.current?.focus();
			}, 100);
			return () => clearTimeout(timer);
		}
	}, [isConnected, hasExited]);

	const HEADER_HEIGHT = 52;
	const keyboardOffset = HEADER_HEIGHT + insets.top + 8;

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
					<Button
						variant="primary"
						size="sm"
						onPress={() => {
							setCreateAttempted(false);
							setError(null);
						}}
					>
						<Button.Label>Retry</Button.Label>
					</Button>
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
					<Button
						variant="primary"
						size="xs"
						onPress={clearOutput}
					>
						<Button.Label>Clear</Button.Label>
					</Button>
					<Button
						variant="primary"
						size="xs"
						onPress={restartSession}
					>
						<Button.Label>Restart</Button.Label>
					</Button>
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
											...fontStyle("500"),
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

			{/* Terminal Output with inline input */}
			<Pressable
				style={styles.terminalContainer}
				onPress={() => inputRef.current?.focus()}
			>
				<ScrollView
					ref={scrollViewRef}
					style={[styles.terminalOutput, { backgroundColor: terminalBg }]}
					contentContainerStyle={[styles.terminalContent, { paddingBottom: Math.max(insets.bottom, Spacing[5]) }]}
					keyboardShouldPersistTaps="handled"
					keyboardDismissMode="none"
					contentInsetAdjustmentBehavior="automatic"
					showsVerticalScrollIndicator={true}
				>
					<AnsiText
						text={output || ""}
						style={[typography.code, styles.terminalText]}
						baseColor={terminalText}
					/>

					{/* Inline input - appears at the end of terminal output */}
					{isConnected && !hasExited && (
						<View style={styles.inlineInputRow}>
							<TextInput
								ref={inputRef}
								defaultValue=""
								onChangeText={(text) => {
									inputValueRef.current = text;
								}}
								onSubmitEditing={() => {
									const value = inputValueRef.current;
									if (value) {
										sendInput(`${value}\n`);
										inputRef.current?.clear();
										inputValueRef.current = "";
									}
								}}
								editable={!hasExited && isConnected}
								autoCapitalize="none"
								autoCorrect={false}
								autoComplete="off"
								spellCheck={false}
								textContentType="none"
								keyboardType="ascii-capable"
								returnKeyType="send"
								blurOnSubmit={false}
								selectTextOnFocus={false}
								enablesReturnKeyAutomatically={false}
								style={[
									typography.code,
									{
										flex: 1,
										color: terminalText,
										backgroundColor: 'transparent',
										padding: 0,
										margin: 0,
										minHeight: 20,
									},
								]}
							/>
						</View>
					)}

					{hasExited && (
						<Text style={[typography.code, { color: colors.mutedForeground, marginTop: 8 }]}>
							[Session ended - tap Restart to begin a new session]
						</Text>
					)}
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
			</Pressable>
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
		padding: Spacing[5],
	},
	// PWA-style header bar
	headerBar: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: Spacing[3],
		paddingVertical: Spacing[2],
		borderBottomWidth: 1,
	},
	headerLeft: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		gap: Spacing[2],
	},
	headerActions: {
		flexDirection: "row",
		alignItems: "center",
		gap: Spacing[2],
	},
	statusDot: {
		width: Spacing[2],
		height: Spacing[2],
		borderRadius: Radius.DEFAULT,
	},
	// Special keys row - PWA style
	specialKeysRow: {
		borderBottomWidth: 1,
	},
	specialKeysContent: {
		paddingHorizontal: Spacing[2],
		paddingVertical: Spacing[2],
		gap: Spacing[1.5],
		flexDirection: "row",
	},
	specialKey: {
		paddingHorizontal: Spacing[2.5],
		paddingVertical: Spacing[1.5],
		borderRadius: Radius.md,
		borderWidth: 1,
		minWidth: Spacing[8],
		alignItems: "center",
	},
	// Terminal content
	terminalContainer: {
		flex: 1,
		minHeight: 0, // Important for flex layout
	},
	terminalOutput: {
		flex: 1,
		minHeight: 0, // Important for flex layout
	},
	terminalContent: {
		padding: Spacing[2],
		paddingBottom: Spacing[5],
		flexGrow: 1, // Ensure content can grow
	},
	terminalText: {
		lineHeight: 16,
	},
	errorBanner: {
		padding: Spacing[2],
		borderTopWidth: 1,
	},
	// Inline input (typing inside terminal)
	inlineInputRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: Spacing[1],
	},
});
