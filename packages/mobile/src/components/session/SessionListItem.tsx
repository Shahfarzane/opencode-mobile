import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	Animated,
	Pressable,
	Text,
	TextInput,
	View,
	type LayoutChangeEvent,
} from "react-native";
import type { Session } from "@/api/sessions";
import {
	CheckIcon,
	ChevronDownIcon,
	ChevronRightIcon,
	CloudIcon,
	CloudOffIcon,
	MoreVerticalIcon,
	ShareIcon,
	WarningIcon,
	XIcon,
} from "@/components/icons";
import { Fonts, FontSizes, getFontFamily, typography, useTheme } from "@/theme";
import { SessionActionsMenu } from "./SessionActionsMenu";

export interface SessionCacheInfo {
	isCached: boolean;
	messageCount: number;
	lastSynced: Date | null;
}

interface SessionListItemProps {
	session: Session;
	isSelected: boolean;
	isStreaming?: boolean;
	depth?: number;
	childCount?: number;
	isExpanded?: boolean;
	isMissingDirectory?: boolean;
	cacheInfo?: SessionCacheInfo;
	isOffline?: boolean;
	onSelect: () => void;
	onToggleExpand?: () => void;
	onRename: (title: string) => Promise<void>;
	onShare: () => Promise<void>;
	onUnshare: () => Promise<void>;
	onCopyLink: () => void;
	onDelete: () => Promise<void>;
}

function formatDateLabel(value: number | string | undefined): string {
	if (!value) return "";
	// Handle Unix timestamps: if the number is less than 10^12, assume seconds and convert to ms
	// Unix timestamp in seconds for 2024+ is ~1.7 billion, in milliseconds is ~1.7 trillion
	let timestamp = typeof value === "string" ? parseInt(value, 10) : value;
	if (timestamp < 1e12) {
		timestamp = timestamp * 1000;
	}
	const date = new Date(timestamp);
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const sessionDate = new Date(
		date.getFullYear(),
		date.getMonth(),
		date.getDate(),
	);
	const diffDays = Math.floor(
		(today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24),
	);

	if (diffDays === 0) return "Today";
	if (diffDays === 1) return "Yesterday";
	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
	});
}

export function SessionListItem({
	session,
	isSelected,
	isStreaming = false,
	depth = 0,
	childCount = 0,
	isExpanded = false,
	isMissingDirectory = false,
	cacheInfo,
	isOffline = false,
	onSelect,
	onToggleExpand,
	onRename,
	onShare,
	onUnshare,
	onCopyLink,
	onDelete,
}: SessionListItemProps) {
	const { colors, isDark } = useTheme();
	const [showMenu, setShowMenu] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [editTitle, setEditTitle] = useState("");
	const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number } | null>(null);
	const animatedOpacity = useRef(new Animated.Value(1)).current;
	const menuButtonRef = useRef<View>(null);

	useEffect(() => {
		if (isStreaming) {
			const animation = Animated.loop(
				Animated.sequence([
					Animated.timing(animatedOpacity, {
						toValue: 0.5,
						duration: 900,
						useNativeDriver: true,
					}),
					Animated.timing(animatedOpacity, {
						toValue: 1,
						duration: 900,
						useNativeDriver: true,
					}),
				]),
			);
			animation.start();
			return () => animation.stop();
		}
		animatedOpacity.setValue(1);
	}, [isStreaming, animatedOpacity]);

	const handleSelect = useCallback(async () => {
		if (isMissingDirectory) return;
		await Haptics.selectionAsync();
		onSelect();
	}, [isMissingDirectory, onSelect]);

	const handleOpenMenu = useCallback(async () => {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		menuButtonRef.current?.measureInWindow((x, y, width, height) => {
			setMenuAnchor({ x: x + width, y: y + height });
			setShowMenu(true);
		});
	}, []);

	const handleStartEdit = useCallback(() => {
		setEditTitle(session.title || `Session ${session.id.slice(0, 8)}`);
		setIsEditing(true);
	}, [session.title, session.id]);

	const handleSaveEdit = useCallback(async () => {
		if (editTitle.trim()) {
			await onRename(editTitle.trim());
		}
		setIsEditing(false);
		setEditTitle("");
	}, [editTitle, onRename]);

	const handleCancelEdit = useCallback(() => {
		setIsEditing(false);
		setEditTitle("");
	}, []);

	const handleToggleExpand = useCallback(async () => {
		await Haptics.selectionAsync();
		onToggleExpand?.();
	}, [onToggleExpand]);

	const sessionTitle = session.title || `Session ${session.id.slice(0, 8)}`;
	const timestamp = session.time?.created || session.createdAt;
	const hasChildren = childCount > 0;
	const isShared = !!session.share?.url;
	const additions = session.summary?.additions;
	const deletions = session.summary?.deletions;
	const hasGitStats =
		typeof additions === "number" || typeof deletions === "number";

	const getBackgroundColor = (pressed: boolean) => {
		if (isSelected) {
			return isDark ? `${colors.accent}CC` : `${colors.primary}1F`;
		}
		if (pressed) {
			return isDark ? `${colors.accent}66` : `${colors.primary}0F`;
		}
		return "transparent";
	};

	if (isEditing) {
		return (
			<View
				className="flex-row items-center px-1.5 py-1 rounded-md mb-0.5 relative"
				style={{
					paddingLeft: 6 + depth * 20,
					backgroundColor: isDark
						? `${colors.accent}CC`
						: `${colors.primary}1F`,
				}}
			>
				<View className="flex-row items-center flex-1 gap-2">
					<TextInput
						value={editTitle}
						onChangeText={setEditTitle}
						className="flex-1 py-1"
						style={[typography.uiLabel, { color: colors.foreground }]}
						autoFocus
						placeholder="Rename session"
						placeholderTextColor={colors.mutedForeground}
						onSubmitEditing={handleSaveEdit}
					/>
					<Pressable onPress={handleSaveEdit} className="p-1" hitSlop={8}>
						<CheckIcon color={colors.foreground} size={16} />
					</Pressable>
					<Pressable onPress={handleCancelEdit} className="p-1" hitSlop={8}>
						<XIcon color={colors.mutedForeground} size={16} />
					</Pressable>
				</View>
			</View>
		);
	}

	return (
		<>
			<Pressable
				onPress={handleSelect}
				disabled={isMissingDirectory}
				className="flex-row items-center px-1.5 py-1 rounded-md mb-0.5 relative"
				style={({ pressed }) => ({
					paddingLeft: 6 + depth * 20,
					backgroundColor: getBackgroundColor(pressed),
					opacity: isMissingDirectory ? 0.75 : 1,
				})}
			>
				<View className="flex-1 min-w-0">
					<Animated.Text
						className="mb-px"
						style={[
							typography.uiLabel,
							{
								color: colors.foreground,
								fontFamily: getFontFamily(isSelected ? "600" : "400"),
								opacity: isStreaming ? animatedOpacity : 1,
							},
						]}
						numberOfLines={1}
					>
						{sessionTitle}
					</Animated.Text>

					<View className="flex-row items-center gap-2 flex-wrap">
						{hasChildren && (
							<Pressable onPress={handleToggleExpand} className="p-0.5" hitSlop={4}>
								{isExpanded ? (
									<ChevronDownIcon color={`${colors.mutedForeground}99`} size={12} />
								) : (
									<ChevronRightIcon color={`${colors.mutedForeground}99`} size={12} />
								)}
							</Pressable>
						)}

						<Text style={[typography.micro, { color: `${colors.mutedForeground}99` }]}>
							{formatDateLabel(timestamp)}
						</Text>

						{isShared && <ShareIcon color={colors.info} size={12} />}

						{hasGitStats && ((additions ?? 0) !== 0 || (deletions ?? 0) !== 0) && (
							<View className="flex-row items-center">
								<Text
									style={{
										fontFamily: Fonts.medium,
										fontSize: FontSizes.microSmall,
										lineHeight: FontSizes.microSmall,
										color: colors.success,
									}}
								>
									+{Math.max(0, additions ?? 0)}
								</Text>
								<Text
									style={{
										fontSize: FontSizes.microSmall,
										color: colors.mutedForeground,
										opacity: 0.5,
										marginHorizontal: 1,
									}}
								>
									/
								</Text>
								<Text
									style={{
										fontFamily: Fonts.medium,
										fontSize: FontSizes.microSmall,
										lineHeight: FontSizes.microSmall,
										color: colors.destructive,
									}}
								>
									-{Math.max(0, deletions ?? 0)}
								</Text>
							</View>
						)}

						{hasChildren && (
							<Text style={[typography.micro, { color: `${colors.mutedForeground}99` }]}>
								{childCount} {childCount === 1 ? "task" : "tasks"}
							</Text>
						)}

						{(isOffline || cacheInfo?.isCached) && (
							<View className="flex-row items-center">
								{isOffline ? (
									<CloudOffIcon color={colors.warning} size={11} />
								) : (
									<CloudIcon color={colors.success} size={11} />
								)}
							</View>
						)}

						{isMissingDirectory && (
							<View className="flex-row items-center gap-0.5">
								<WarningIcon color={colors.warning} size={12} />
								<Text style={[typography.micro, { color: colors.warning }]}>
									Missing
								</Text>
							</View>
						)}
					</View>
				</View>

			<Pressable ref={menuButtonRef} onPress={handleOpenMenu} className="p-1.5 ml-1" hitSlop={8}>
				<MoreVerticalIcon color={colors.mutedForeground} size={18} />
			</Pressable>

				{isSelected && (
					<View
						className="absolute right-0 top-1 bottom-1 w-0.5 rounded-sm"
						style={{ backgroundColor: colors.primary }}
					/>
				)}
			</Pressable>

		<SessionActionsMenu
			visible={showMenu}
			onClose={() => setShowMenu(false)}
			onRename={handleStartEdit}
			onShare={onShare}
			onCopyLink={onCopyLink}
			onUnshare={onUnshare}
			onDelete={onDelete}
			isShared={isShared}
			shareUrl={session.share?.url}
			anchorPosition={menuAnchor}
		/>
		</>
	);
}
