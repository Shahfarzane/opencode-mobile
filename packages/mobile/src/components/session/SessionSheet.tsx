import BottomSheet, {
	BottomSheetFlatList,
	useBottomSheetSpringConfigs,
} from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { forwardRef, useCallback, useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Session } from "@/api/sessions";
import { PlusIcon, WifiOffIcon } from "@/components/icons";
import {
	getNetworkStatus,
	type NetworkStatus,
	subscribeToNetworkStatus,
} from "@/lib/sessionSync";
import { AnimationTokens, RadiusTokens, fontStyle, typography, useTheme } from "@/theme";
import { OPACITY, withOpacity } from "@/utils/colors";
import { DirectoryRow } from "./DirectoryRow";
import { type SessionCacheInfo, SessionListItem } from "./SessionListItem";
import { SheetHeader } from "./SheetHeader";

const EXPANDED_PARENTS_STORAGE_KEY = "oc.sessions.expandedParents";

type SessionNode = {
	session: Session;
	children: SessionNode[];
};

type SessionGroupData = {
	id: string;
	label: string;
	description: string | null;
	isMain: boolean;
	directory: string | null;
	sessions: SessionNode[];
};

type SessionListRow =
	| {
			type: "group";
			group: SessionGroupData;
			isCollapsed: boolean;
			remainingCount: number;
			isExpanded: boolean;
		}
	| {
			type: "session";
			session: Session;
			depth: number;
			hasChildren: boolean;
			isExpanded: boolean;
			childCount: number;
			cacheInfo?: SessionCacheInfo;
			isStreaming: boolean;
			isSelected: boolean;
		}
	| {
			type: "showMore";
			groupId: string;
			remainingCount: number;
			isExpanded: boolean;
		}
	| {
			type: "empty";
			groupId: string;
		};

interface SessionSheetProps {
	sessions: Session[];
	currentSessionId: string | null;
	currentDirectory: string | null;
	isLoading?: boolean;
	isGitRepo?: boolean;
	streamingSessionIds?: Set<string>;
	sessionCacheInfo?: Map<string, SessionCacheInfo>;
	onSelectSession: (session: Session) => void;
	onNewSession: (directory?: string | null) => void;
	onRenameSession?: (sessionId: string, title: string) => Promise<void>;
	onShareSession?: (sessionId: string) => Promise<Session | null>;
	onUnshareSession?: (sessionId: string) => Promise<boolean>;
	onDeleteSession?: (sessionId: string) => Promise<boolean>;
	onChangeDirectory?: () => void;
	onOpenWorktreeManager?: () => void;
	onOpenMultiRunLauncher?: () => void;
}

const MAX_VISIBLE_SESSIONS = 7;

function normalizePath(value?: string | null): string | null {
	if (!value) return null;
	const normalized = value.replace(/\\/g, "/").replace(/\/+$/, "");
	return normalized.length === 0 ? "/" : normalized;
}

function formatDirectoryName(directory: string | null): string {
	if (!directory) return "/";
	const parts = directory.replace(/\/$/, "").split("/");
	return parts[parts.length - 1] || "/";
}

export const SessionSheet = forwardRef<BottomSheet, SessionSheetProps>(
	function SessionSheet(
		{
			sessions,
			currentSessionId,
			currentDirectory,
			isLoading,
			isGitRepo = false,
			streamingSessionIds,
			sessionCacheInfo,
			onSelectSession,
			onNewSession,
			onRenameSession,
			onShareSession,
			onUnshareSession,
			onDeleteSession,
			onChangeDirectory,
			onOpenWorktreeManager,
			onOpenMultiRunLauncher,
		},
		ref,
	) {
		const { colors } = useTheme();
		const insets = useSafeAreaInsets();
		const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
			new Set(),
		);
		const [expandedParents, setExpandedParents] = useState<Set<string>>(
			new Set(),
		);
		const [expandedSessionGroups, setExpandedSessionGroups] = useState<
			Set<string>
		>(new Set());
		const [networkStatus, setNetworkStatus] =
			useState<NetworkStatus>(getNetworkStatus);

		const snapPoints = useMemo(() => {
			return ["50%", "90%"];
		}, []);

		const sheetBackgroundStyle = useMemo(
			() => ({
				backgroundColor: colors.card,
				borderColor: withOpacity(colors.border, OPACITY.border),
				borderWidth: 1,
				borderRadius: RadiusTokens["3xl"],
				overflow: "hidden" as const,
			}),
			[colors],
		);

		const sheetHandleStyle = useMemo(
			() => ({
				backgroundColor: withOpacity(colors.mutedForeground, OPACITY.secondary),
				width: 48,
				height: 5,
				borderRadius: 999,
			}),
			[colors],
		);

		const animationConfigs = useBottomSheetSpringConfigs({
			...AnimationTokens.sheetSpring,
			overshootClamping: true,
		});

		const sortedSessions = useMemo(() => {
			return [...sessions].sort((a, b) => {
				const timeA = a.time?.created || a.createdAt || 0;
				const timeB = b.time?.created || b.createdAt || 0;
				return timeB - timeA;
			});
		}, [sessions]);

		const { childrenMap, sessionMap, parentMap } = useMemo(() => {
			const sessionMap = new Map(sortedSessions.map((s) => [s.id, s]));
			const childrenMap = new Map<string, Session[]>();
			const parentMap = new Map<string, string>();

			for (const session of sortedSessions) {
				if (session.parentID && sessionMap.has(session.parentID)) {
					const existing = childrenMap.get(session.parentID) || [];
					existing.push(session);
					childrenMap.set(session.parentID, existing);
					parentMap.set(session.id, session.parentID);
				}
			}

			for (const list of childrenMap.values()) {
				list.sort((a, b) => {
					const timeA = a.time?.created || a.createdAt || 0;
					const timeB = b.time?.created || b.createdAt || 0;
					return timeB - timeA;
				});
			}

			return { childrenMap, sessionMap, parentMap };
		}, [sortedSessions]);

		useEffect(() => {
			return subscribeToNetworkStatus(setNetworkStatus);
		}, []);

		useEffect(() => {
			const loadExpandedParents = async () => {
				try {
					const stored = await AsyncStorage.getItem(
						EXPANDED_PARENTS_STORAGE_KEY,
					);
					if (stored) {
						const parsed = JSON.parse(stored);
						if (Array.isArray(parsed)) {
							setExpandedParents(
								new Set(parsed.filter((item) => typeof item === "string")),
							);
						}
					}
				} catch {
					// Ignore errors
				}
			};
			loadExpandedParents();
		}, []);

		useEffect(() => {
			if (!currentSessionId) return;
			setExpandedParents((previous) => {
				const next = new Set(previous);
				let cursor = parentMap.get(currentSessionId) || null;
				let changed = false;
				while (cursor) {
					if (!next.has(cursor)) {
						next.add(cursor);
						changed = true;
					}
					cursor = parentMap.get(cursor) || null;
				}
				return changed ? next : previous;
			});
		}, [currentSessionId, parentMap]);

		const buildNode = useCallback(
			(session: Session): SessionNode => {
				const children = childrenMap.get(session.id) || [];
				return {
					session,
					children: children.map((child) => buildNode(child)),
				};
			},
			[childrenMap],
		);

		const groupedSessions = useMemo<SessionGroupData[]>(() => {
			const groups = new Map<string, SessionGroupData>();
			const normalizedRoot = normalizePath(currentDirectory);

			const roots = sortedSessions.filter((session) => {
				if (!session.parentID) return true;
				return !sessionMap.has(session.parentID);
			});

			roots.forEach((session) => {
				const sessionDir = normalizePath(session.directory);
				const isMain =
					sessionDir === normalizedRoot ||
					(!sessionDir && Boolean(normalizedRoot));
				const key = isMain ? "main" : sessionDir || session.id;

				if (!groups.has(key)) {
					groups.set(key, {
						id: key,
						label: isMain ? "Main workspace" : formatDirectoryName(sessionDir),
						description: sessionDir,
						isMain,
						directory: sessionDir || normalizedRoot,
						sessions: [],
					});
				}

				const group = groups.get(key);
				if (group) {
					group.sessions.push(buildNode(session));
				}
			});

			if (!groups.has("main")) {
				groups.set("main", {
					id: "main",
					label: "Main workspace",
					description: currentDirectory,
					isMain: true,
					directory: normalizedRoot,
					sessions: [],
				});
			}

			return Array.from(groups.values()).sort((a, b) => {
				if (a.isMain !== b.isMain) return a.isMain ? -1 : 1;
				return a.label.localeCompare(b.label);
			});
		}, [sortedSessions, sessionMap, currentDirectory, buildNode]);

		const handleSelectSession = useCallback(
			(session: Session) => {
				// Haptics handled by SessionListItem
				onSelectSession(session);
			},
			[onSelectSession],
		);

		const toggleGroup = useCallback((groupId: string) => {
			setCollapsedGroups((prev) => {
				const next = new Set(prev);
				if (next.has(groupId)) {
					next.delete(groupId);
				} else {
					next.add(groupId);
				}
				return next;
			});
		}, []);

		const toggleParent = useCallback((sessionId: string) => {
			setExpandedParents((prev) => {
				const next = new Set(prev);
				if (next.has(sessionId)) {
					next.delete(sessionId);
				} else {
					next.add(sessionId);
				}
				AsyncStorage.setItem(
					EXPANDED_PARENTS_STORAGE_KEY,
					JSON.stringify(Array.from(next)),
				).catch(() => {});
				return next;
			});
		}, []);

		const toggleGroupSessionLimit = useCallback((groupId: string) => {
			setExpandedSessionGroups((prev) => {
				const next = new Set(prev);
				if (next.has(groupId)) {
					next.delete(groupId);
				} else {
					next.add(groupId);
				}
				return next;
			});
		}, []);

		const countChildren = useCallback((node: SessionNode): number => {
			let count = node.children.length;
			node.children.forEach((child) => {
				count += countChildren(child);
			});
			return count;
		}, []);

		const handleDismiss = useCallback(() => {
			(ref as React.RefObject<BottomSheet>)?.current?.close();
		}, [ref]);

		const isOffline = networkStatus === "offline";

		const handleGroupToggle = useCallback(
			async (groupId: string) => {
				await Haptics.selectionAsync();
				toggleGroup(groupId);
			},
			[toggleGroup],
		);

		const handleGroupCreateSession = useCallback(
			async (directory?: string | null) => {
				await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
				onNewSession(directory);
			},
			[onNewSession],
		);

		const flattenSessionNodes = useCallback(
			(
				nodes: SessionNode[],
				rows: SessionListRow[],
				depth: number = 0,
			) => {
				for (const node of nodes) {
					const session = node.session;
					const hasChildren = node.children.length > 0;
					const isExpanded = expandedParents.has(session.id);
					const childCount = countChildren(node);
					rows.push({
						type: "session",
						session,
						depth,
						hasChildren,
						isExpanded,
						childCount,
						cacheInfo: sessionCacheInfo?.get(session.id),
						isStreaming: streamingSessionIds?.has(session.id) || false,
						isSelected: session.id === currentSessionId,
					});

					if (hasChildren && isExpanded) {
						flattenSessionNodes(node.children, rows, depth + 1);
					}
				}
			},
			[
				expandedParents,
				countChildren,
				sessionCacheInfo,
				streamingSessionIds,
				currentSessionId,
			],
		);

		const sessionRows = useMemo(() => {
			const rows: SessionListRow[] = [];

			for (const group of groupedSessions) {
				const isCollapsed = collapsedGroups.has(group.id);
				const isExpanded = expandedSessionGroups.has(group.id);
				const visibleSessions = isExpanded
					? group.sessions
					: group.sessions.slice(0, MAX_VISIBLE_SESSIONS);
				const remainingCount = Math.max(
					0,
					group.sessions.length - visibleSessions.length,
				);

				rows.push({
					type: "group",
					group,
					isCollapsed,
					remainingCount,
					isExpanded,
				});

				if (!isCollapsed) {
					if (group.sessions.length === 0) {
						rows.push({ type: "empty", groupId: group.id });
					} else {
						flattenSessionNodes(visibleSessions, rows, 0);

						if (remainingCount > 0 || isExpanded) {
							rows.push({
								type: "showMore",
								groupId: group.id,
								remainingCount,
								isExpanded,
							});
						}
					}
				}
			}

			return rows;
		}, [groupedSessions, collapsedGroups, expandedSessionGroups, flattenSessionNodes]);

		const renderSessionRow = useCallback(
			({ item }: { item: SessionListRow }) => {
				if (item.type === "group") {
					return (
						<View className="mb-1 w-full">
							<View
								className="flex-row items-center justify-between pt-1.5 pb-1 px-1 border-b"
								style={{ borderBottomColor: colors.border }}
							>
								<TouchableOpacity
									onPress={() => handleGroupToggle(item.group.id)}
									activeOpacity={0.7}
									className="flex-1 rounded"
								>
									<Text
										style={[
											typography.micro,
											fontStyle("600"),
											{
												color: withOpacity(
													colors.foreground,
													OPACITY.secondary,
												),
											},
										]}
										numberOfLines={1}
									>
										{item.group.label}
									</Text>
								</TouchableOpacity>
								<TouchableOpacity
									onPress={() =>
									handleGroupCreateSession(item.group.directory)
								}
									activeOpacity={0.7}
									className="w-5 h-5 items-center justify-center rounded-md"
									hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
								>
									<PlusIcon
										color={withOpacity(
											colors.foreground,
											OPACITY.secondary,
										)}
										size={18}
									/>
								</TouchableOpacity>
							</View>
						</View>
					);
				}

				if (item.type === "showMore") {
					return (
						<TouchableOpacity
							onPress={async () => {
								await Haptics.selectionAsync();
								toggleGroupSessionLimit(item.groupId);
							}}
							activeOpacity={0.7}
							className="py-0.5 px-1.5 mt-0.5"
						>
							<Text
								style={[
									typography.micro,
									{
										color: withOpacity(
											colors.foreground,
											OPACITY.secondary,
										),
									},
								]}
							>
								{item.isExpanded
									? "Show fewer sessions"
									: `Show ${item.remainingCount} more ${
										item.remainingCount === 1 ? "session" : "sessions"
									}`}
							</Text>
						</TouchableOpacity>
					);
				}

				if (item.type === "empty") {
					return (
						<Text
							className="py-1 px-1"
							style={[
								typography.micro,
								{
									color: withOpacity(
										colors.foreground,
										OPACITY.secondary,
									),
								},
							]}
						>
							No sessions in this workspace yet.
						</Text>
					);
				}

				const session = item.session;

				const handleRename = async (title: string) => {
					await onRenameSession?.(session.id, title);
				};

				const handleShare = async () => {
					await onShareSession?.(session.id);
				};

				const handleUnshare = async () => {
					await onUnshareSession?.(session.id);
				};

				const handleCopyLink = () => {};

				const handleDelete = async () => {
					await onDeleteSession?.(session.id);
				};

				return (
					<View className="mb-2.5 w-full">
						<SessionListItem
							session={session}
							isSelected={item.isSelected}
							isStreaming={item.isStreaming}
							depth={item.depth}
							childCount={item.childCount}
							isExpanded={item.isExpanded}
							cacheInfo={item.cacheInfo}
							isOffline={isOffline}
							onSelect={() => handleSelectSession(session)}
							onToggleExpand={
								item.hasChildren ? () => toggleParent(session.id) : undefined
							}
							onRename={handleRename}
							onShare={handleShare}
							onUnshare={handleUnshare}
							onCopyLink={handleCopyLink}
							onDelete={handleDelete}
						/>
					</View>
				);
			},
			[
				colors.border,
				colors.foreground,
				handleGroupToggle,
				handleGroupCreateSession,
				handleSelectSession,
				onRenameSession,
				onShareSession,
				onUnshareSession,
				onDeleteSession,
				isOffline,
				toggleParent,
				toggleGroupSessionLimit,
			],
		);

		const keyExtractor = useCallback((item: SessionListRow, index: number) => {
			if (item.type === "group") return `group-${item.group.id}`;
			if (item.type === "session") return `session-${item.session.id}`;
			if (item.type === "showMore") return `showMore-${item.groupId}`;
			if (item.type === "empty") return `empty-${item.groupId}`;
			return `row-${index}`;
		}, []);

		return (
			<BottomSheet
				ref={ref}
				index={-1}
				snapPoints={snapPoints}
				enablePanDownToClose={true}
				enableContentPanningGesture={false}
				enableHandlePanningGesture={true}
				topInset={insets.top}
				animationConfigs={animationConfigs}
				backgroundStyle={sheetBackgroundStyle}
				handleIndicatorStyle={sheetHandleStyle}
				containerStyle={{ pointerEvents: "box-none" }}
			>
				<SheetHeader title="Sessions" onClose={handleDismiss} />

				{isOffline && (
					<View
						className="flex-row items-center justify-center gap-1.5 py-1.5 mx-3 mb-2 rounded-md"
						style={{ backgroundColor: colors.warning }}
					>
						<WifiOffIcon color={colors.warningForeground} size={14} />
						<Text
							style={[
								typography.micro,
								fontStyle("600"),
								{ color: colors.warningForeground },
							]}
						>
							Offline Mode
						</Text>
					</View>
				)}

				<DirectoryRow
					directory={currentDirectory}
					isGitRepo={isGitRepo}
					onChangeDirectory={onChangeDirectory}
					onOpenWorktreeManager={onOpenWorktreeManager}
					onOpenMultiRunLauncher={onOpenMultiRunLauncher}
				/>

				{isLoading ? (
					<View className="items-center py-6 gap-1">
						<Text
							style={[
								typography.uiLabel,
								{ color: withOpacity(colors.foreground, OPACITY.secondary) },
							]}
						>
							Loading sessions...
						</Text>
					</View>
				) : sessions.length === 0 ? (
					<View className="items-center py-6 gap-1">
						<Text
							style={[
								typography.uiLabel,
								{ color: withOpacity(colors.foreground, OPACITY.secondary) },
							]}
						>
							No sessions yet
						</Text>
						<Text
							style={[
								typography.micro,
								{ color: withOpacity(colors.foreground, OPACITY.secondary) },
							]}
						>
							Create your first session to start coding.
						</Text>
					</View>
				) : (
					<BottomSheetFlatList
						data={sessionRows}
						renderItem={renderSessionRow}
						keyExtractor={keyExtractor}
						contentContainerStyle={{
							paddingLeft: 10,
							paddingRight: 4,
							paddingBottom: Math.max(40, insets.bottom + 20),
						}}
						keyboardShouldPersistTaps="handled"
						showsVerticalScrollIndicator={false}
						initialNumToRender={12}
						maxToRenderPerBatch={12}
						updateCellsBatchingPeriod={50}
						windowSize={7}
						removeClippedSubviews={true}
					/>
				)}
			</BottomSheet>
		);
	},
);

export default SessionSheet;
