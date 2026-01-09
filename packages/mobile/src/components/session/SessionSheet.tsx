import BottomSheet, {
	BottomSheetBackdrop,
	type BottomSheetBackdropProps,
	BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { forwardRef, useCallback, useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Session } from "@/api/sessions";
import { WifiOffIcon } from "@/components/icons";
import {
	getNetworkStatus,
	type NetworkStatus,
	subscribeToNetworkStatus,
} from "@/lib/sessionSync";
import { fontStyle, typography, useTheme } from "@/theme";
import { DirectoryRow } from "./DirectoryRow";
import { type SessionCacheInfo, SessionListItem } from "./SessionListItem";
import { SheetHeader } from "./SheetHeader";
import { WorkspaceGroup } from "./WorkspaceGroup";

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

				groups.get(key)!.sessions.push(buildNode(session));
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
			async (session: Session) => {
				await Haptics.selectionAsync();
				onSelectSession(session);
			},
			[onSelectSession],
		);

		const handleNewSession = useCallback(
			async (directory?: string | null) => {
				await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
				onNewSession(directory);
			},
			[onNewSession],
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

		const renderBackdrop = useCallback(
			(props: BottomSheetBackdropProps) => (
				<BottomSheetBackdrop
					{...props}
					disappearsOnIndex={-1}
					appearsOnIndex={0}
					opacity={0.5}
				/>
			),
			[],
		);

		const isOffline = networkStatus === "offline";

		const renderSessionNode = useCallback(
			(node: SessionNode, depth = 0): React.ReactNode => {
				const session = node.session;
				const isSelected = session.id === currentSessionId;
				const isStreaming = streamingSessionIds?.has(session.id) || false;
				const hasChildren = node.children.length > 0;
				const isExpanded = expandedParents.has(session.id);
				const childCount = countChildren(node);
				const cacheInfo = sessionCacheInfo?.get(session.id);

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
					<View key={session.id}>
						<SessionListItem
							session={session}
							isSelected={isSelected}
							isStreaming={isStreaming}
							depth={depth}
							childCount={childCount}
							isExpanded={isExpanded}
							cacheInfo={cacheInfo}
							isOffline={isOffline}
							onSelect={() => handleSelectSession(session)}
							onToggleExpand={
								hasChildren ? () => toggleParent(session.id) : undefined
							}
							onRename={handleRename}
							onShare={handleShare}
							onUnshare={handleUnshare}
							onCopyLink={handleCopyLink}
							onDelete={handleDelete}
						/>
						{hasChildren && isExpanded && (
							<View>
								{node.children.map((child) =>
									renderSessionNode(child, depth + 1),
								)}
							</View>
						)}
					</View>
				);
			},
			[
				currentSessionId,
				streamingSessionIds,
				expandedParents,
				countChildren,
				handleSelectSession,
				toggleParent,
				onRenameSession,
				onShareSession,
				onUnshareSession,
				onDeleteSession,
				sessionCacheInfo,
				isOffline,
			],
		);

		return (
			<BottomSheet
				ref={ref}
				index={-1}
				snapPoints={snapPoints}
				enablePanDownToClose={true}
				topInset={insets.top}
				backgroundStyle={{ backgroundColor: colors.background }}
				handleIndicatorStyle={{ backgroundColor: colors.mutedForeground }}
				backdropComponent={renderBackdrop}
				style={{ zIndex: 1000, elevation: 1000 }}
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

				<BottomSheetScrollView
					className="flex-1"
					contentContainerStyle={{
						paddingLeft: 10,
						paddingRight: 4,
						paddingBottom: Math.max(40, insets.bottom + 20),
					}}
				>
					{isLoading ? (
						<View className="items-center py-6 gap-1">
							<Text
								style={[typography.uiLabel, { color: colors.mutedForeground }]}
							>
								Loading sessions...
							</Text>
						</View>
					) : sessions.length === 0 ? (
						<View className="items-center py-6 gap-1">
							<Text
								style={[typography.uiLabel, { color: colors.mutedForeground }]}
							>
								No sessions yet
							</Text>
							<Text
								style={[typography.micro, { color: colors.mutedForeground }]}
							>
								Create your first session to start coding.
							</Text>
						</View>
					) : (
						groupedSessions.map((group) => {
							const isCollapsed = collapsedGroups.has(group.id);
							const isExpanded = expandedSessionGroups.has(group.id);
							const visibleSessions = isExpanded
								? group.sessions
								: group.sessions.slice(0, MAX_VISIBLE_SESSIONS);
							const remainingCount =
								group.sessions.length - visibleSessions.length;

							return (
								<WorkspaceGroup
									key={group.id}
									groupId={group.id}
									label={group.label}
									sessionCount={group.sessions.length}
									isCollapsed={isCollapsed}
									onToggleCollapse={() => toggleGroup(group.id)}
									onCreateSession={() => handleNewSession(group.directory)}
									showMoreButton={
										group.sessions.length > MAX_VISIBLE_SESSIONS
											? {
													remainingCount: isExpanded ? 0 : remainingCount,
													isExpanded,
													onToggle: () => toggleGroupSessionLimit(group.id),
												}
											: undefined
									}
								>
									{visibleSessions.map((node) => renderSessionNode(node, 0))}
								</WorkspaceGroup>
							);
						})
					)}
				</BottomSheetScrollView>
			</BottomSheet>
		);
	},
);

export default SessionSheet;
