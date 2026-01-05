import BottomSheet, {
	BottomSheetScrollView,
	BottomSheetBackdrop,
	type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import { forwardRef, useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Session } from "@/api/sessions";
import { PlusIcon } from "@/components/icons";
import { typography, useTheme } from "@/theme";
import { DirectoryRow } from "./DirectoryRow";
import { SessionListItem } from "./SessionListItem";
import { SheetHeader } from "./SheetHeader";
import { WorkspaceGroup } from "./WorkspaceGroup";

// Types for session tree structure
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
		const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
			new Set(),
		);
		const [expandedParents, setExpandedParents] = useState<Set<string>>(
			new Set(),
		);
		const [expandedSessionGroups, setExpandedSessionGroups] = useState<
			Set<string>
		>(new Set());

		const snapPoints = useMemo(() => ["50%", "90%"], []);

		// Sort sessions by creation time (newest first)
		const sortedSessions = useMemo(() => {
			return [...sessions].sort((a, b) => {
				const timeA = a.time?.created || a.createdAt || 0;
				const timeB = b.time?.created || b.createdAt || 0;
				return timeB - timeA;
			});
		}, [sessions]);

		// Build parent-child maps
		const { childrenMap, sessionMap } = useMemo(() => {
			const sessionMap = new Map(sortedSessions.map((s) => [s.id, s]));
			const childrenMap = new Map<string, Session[]>();

			sortedSessions.forEach((session) => {
				if (session.parentID && sessionMap.has(session.parentID)) {
					const existing = childrenMap.get(session.parentID) || [];
					existing.push(session);
					childrenMap.set(session.parentID, existing);
				}
			});

			// Sort children by creation time
			childrenMap.forEach((list) =>
				list.sort((a, b) => {
					const timeA = a.time?.created || a.createdAt || 0;
					const timeB = b.time?.created || b.createdAt || 0;
					return timeB - timeA;
				}),
			);

			return { childrenMap, sessionMap };
		}, [sortedSessions]);

		// Build session node tree
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

		// Group sessions by directory
		const groupedSessions = useMemo<SessionGroupData[]>(() => {
			const groups = new Map<string, SessionGroupData>();
			const normalizedRoot = normalizePath(currentDirectory);

			// Get root sessions (no parent or parent not in current list)
			const roots = sortedSessions.filter((session) => {
				if (!session.parentID) return true;
				return !sessionMap.has(session.parentID);
			});

			// Group each root session
			roots.forEach((session) => {
				const sessionDir = normalizePath(session.directory);
				const isMain =
					sessionDir === normalizedRoot ||
					(!sessionDir && Boolean(normalizedRoot));
				const key = isMain ? "main" : sessionDir || session.id;

				if (!groups.has(key)) {
					groups.set(key, {
						id: key,
						label: isMain
							? "Main workspace"
							: formatDirectoryName(sessionDir),
						description: sessionDir,
						isMain,
						directory: sessionDir || normalizedRoot,
						sessions: [],
					});
				}

				groups.get(key)!.sessions.push(buildNode(session));
			});

			// Ensure main group always exists
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

			// Sort: main first, then alphabetical
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

		// Count total children recursively
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

		const renderSessionNode = useCallback(
			(node: SessionNode, depth = 0): React.ReactNode => {
				const session = node.session;
				const isSelected = session.id === currentSessionId;
				const isStreaming = streamingSessionIds?.has(session.id) || false;
				const hasChildren = node.children.length > 0;
				const isExpanded = expandedParents.has(session.id);
				const childCount = countChildren(node);

				const handleRename = async (title: string) => {
					await onRenameSession?.(session.id, title);
				};

				const handleShare = async () => {
					await onShareSession?.(session.id);
				};

				const handleUnshare = async () => {
					await onUnshareSession?.(session.id);
				};

				const handleCopyLink = () => {
					// Copy is handled by SessionActionsMenu
				};

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
								{node.children.map((child) => renderSessionNode(child, depth + 1))}
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
			],
		);

		return (
			<BottomSheet
				ref={ref}
				index={-1}
				snapPoints={snapPoints}
				enablePanDownToClose={true}
				backgroundStyle={{ backgroundColor: colors.background }}
				handleIndicatorStyle={{ backgroundColor: colors.mutedForeground }}
				backdropComponent={renderBackdrop}
			>
				<SheetHeader title="Sessions" onClose={handleDismiss} />

				<DirectoryRow
					directory={currentDirectory}
					isGitRepo={isGitRepo}
					onChangeDirectory={onChangeDirectory}
					onOpenWorktreeManager={onOpenWorktreeManager}
					onOpenMultiRunLauncher={onOpenMultiRunLauncher}
				/>

				<BottomSheetScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
				>
					{/* New Session Button */}
					<Pressable
						onPress={() => handleNewSession(currentDirectory)}
						style={({ pressed }) => [
							styles.newSessionButton,
							{
								borderColor: colors.primary,
								backgroundColor: pressed
									? `${colors.primary}25`
									: `${colors.primary}15`,
							},
						]}
					>
						<View style={styles.newSessionContent}>
							<PlusIcon color={colors.primary} size={18} />
							<View style={styles.newSessionText}>
								<Text
									style={[
										typography.uiLabel,
										{ color: colors.primary, fontWeight: "600" },
									]}
								>
									New Session
								</Text>
								<Text style={[typography.micro, { color: colors.mutedForeground }]}>
									Start a fresh conversation
								</Text>
							</View>
						</View>
					</Pressable>

					{/* Loading State */}
					{isLoading ? (
						<View style={styles.emptyState}>
							<Text style={[typography.uiLabel, { color: colors.mutedForeground }]}>
								Loading sessions...
							</Text>
						</View>
					) : sessions.length === 0 ? (
						<View style={styles.emptyState}>
							<Text style={[typography.uiLabel, { color: colors.mutedForeground }]}>
								No sessions yet
							</Text>
							<Text style={[typography.micro, { color: colors.mutedForeground }]}>
								Create your first session to start coding.
							</Text>
						</View>
					) : (
						/* Session Groups */
						groupedSessions.map((group) => {
							const isCollapsed = collapsedGroups.has(group.id);
							const isExpanded = expandedSessionGroups.has(group.id);
							const visibleSessions = isExpanded
								? group.sessions
								: group.sessions.slice(0, MAX_VISIBLE_SESSIONS);
							const remainingCount = group.sessions.length - visibleSessions.length;

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

const styles = StyleSheet.create({
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		paddingHorizontal: 16,
		paddingBottom: 40,
	},
	newSessionButton: {
		borderRadius: 12,
		borderWidth: 1.5,
		marginBottom: 16,
	},
	newSessionContent: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		padding: 16,
	},
	newSessionText: {
		flex: 1,
	},
	emptyState: {
		alignItems: "center",
		paddingVertical: 40,
		gap: 4,
	},
});

export default SessionSheet;
