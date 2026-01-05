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
import { useTerminalStream } from "../../src/hooks/useTerminalStream";
import { useConnectionStore } from "../../src/stores/useConnectionStore";
import { useTerminalStore } from "../../src/stores/useTerminalStore";
import { typography, useTheme } from "../../src/theme";

const SPECIAL_KEYS = [
	{ label: "Ctrl", key: "ctrl" },
	{ label: "Tab", key: "\t" },
	{ label: "Esc", key: "\x1b" },
	{ label: "Up", key: "\x1b[A" },
	{ label: "Down", key: "\x1b[B" },
	{ label: "C-c", key: "\x03" },
	{ label: "C-d", key: "\x04" },
	{ label: "C-z", key: "\x1a" },
];

export default function TerminalScreen() {
	const insets = useSafeAreaInsets();
	const { colors, isDark } = useTheme();
	const { directory, isConnected: isServerConnected } = useConnectionStore();
	const scrollViewRef = useRef<ScrollView>(null);
	const inputRef = useRef<TextInput>(null);

	const [inputValue, setInputValue] = useState("");
	const [ctrlMode, setCtrlMode] = useState(false);
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
			appendOutput(`Terminal session started in ${directory}\n\r`);
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
		},
		[ctrlMode, sendInput],
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

		return (
			<View style={styles.terminalContainer}>
				<ScrollView
					ref={scrollViewRef}
					style={[styles.terminalOutput, { backgroundColor: terminalBg }]}
					contentContainerStyle={styles.terminalContent}
				>
					<Text
						style={[
							typography.code,
							styles.terminalText,
							{ color: terminalText },
						]}
						selectable
					>
						{output || ""}
					</Text>
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
		);
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			style={[styles.container, { backgroundColor: colors.background }]}
			keyboardVerticalOffset={keyboardOffset}
		>
			{renderContent()}

			{sessionId && (
				<View
					style={[
						styles.inputArea,
						{
							borderTopColor: colors.border,
							backgroundColor: colors.background,
						},
					]}
				>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.specialKeys}
					>
						{SPECIAL_KEYS.map((item) => (
							<Pressable
								key={item.label}
								onPress={() => handleSpecialKey(item.key)}
								style={[
									styles.specialKey,
									{
										backgroundColor:
											item.key === "ctrl" && ctrlMode
												? colors.primary
												: colors.muted,
										borderColor:
											item.key === "ctrl" && ctrlMode
												? colors.primary
												: colors.border,
									},
								]}
							>
								<Text
									style={[
										typography.micro,
										{
											color:
												item.key === "ctrl" && ctrlMode
													? colors.primaryForeground
													: colors.foreground,
											fontWeight: "500",
										},
									]}
								>
									{item.label}
								</Text>
							</Pressable>
						))}

						<View
							style={[styles.keyDivider, { backgroundColor: colors.border }]}
						/>

						<Pressable
							onPress={clearOutput}
							style={[
								styles.specialKey,
								{ backgroundColor: colors.muted, borderColor: colors.border },
							]}
						>
							<Text
								style={[
									typography.micro,
									{ color: colors.foreground, fontWeight: "500" },
								]}
							>
								Clear
							</Text>
						</Pressable>

						{hasExited ? (
							<Pressable
								onPress={restartSession}
								style={[styles.specialKey, { backgroundColor: colors.success }]}
							>
								<Text
									style={[
										typography.micro,
										{ color: colors.primaryForeground, fontWeight: "500" },
									]}
								>
									Restart
								</Text>
							</Pressable>
						) : (
							<Pressable
								onPress={closeSession}
								style={[
									styles.specialKey,
									{ backgroundColor: colors.destructive },
								]}
							>
								<Text
									style={[
										typography.micro,
										{ color: colors.primaryForeground, fontWeight: "500" },
									]}
								>
									Kill
								</Text>
							</Pressable>
						)}
					</ScrollView>

					<View
						style={[
							styles.inputRow,
							{ paddingBottom: Math.max(insets.bottom, 8) },
						]}
					>
						<View
							style={[
								styles.inputWrapper,
								{ backgroundColor: terminalBg, borderColor: colors.border },
							]}
						>
							<Text style={[typography.uiLabel, { color: colors.success }]}>
								$
							</Text>
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
								style={[
									styles.textInput,
									typography.body,
									{ color: terminalText },
								]}
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
				</View>
			)}
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
	inputArea: {
		borderTopWidth: 1,
	},
	specialKeys: {
		paddingHorizontal: 8,
		paddingVertical: 8,
		gap: 6,
		flexDirection: "row",
	},
	specialKey: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 6,
		borderWidth: 1,
	},
	keyDivider: {
		width: 1,
		marginHorizontal: 4,
	},
	inputRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 8,
		gap: 8,
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
