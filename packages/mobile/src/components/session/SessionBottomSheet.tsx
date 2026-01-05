import { forwardRef, useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import BottomSheet, {
	BottomSheetBackdrop,
	BottomSheetScrollView,
	type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import Svg, { Path } from "react-native-svg";
import { useTheme, typography } from "@/theme";
import type { Session } from "@/api/sessions";

interface DateGroup {
	label: string;
	sessions: Session[];
}

interface SessionBottomSheetProps {
	sessions: Session[];
	currentSessionId: string | null;
	isLoading?: boolean;
	onSelectSession: (session: Session) => void;
	onNewSession: () => void;
	onClose: () => void;
}

function PlusIcon({ color }: { color: string }) {
	return (
		<Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
			<Path
				d="M12 5v14M5 12h14"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
			/>
		</Svg>
	);
}

function ChatIcon({ color }: { color: string }) {
	return (
		<Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
			<Path
				d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

function formatSessionTime(timestamp: number | string | undefined): string {
	if (!timestamp) return "";
	const date = new Date(timestamp);
	return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getDateGroupLabel(timestamp: number | string | undefined): string {
	if (!timestamp) return "Unknown";
	const date = new Date(timestamp);
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const sessionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	const diffDays = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));

	if (diffDays === 0) return "Today";
	if (diffDays === 1) return "Yesterday";
	if (diffDays < 7) return date.toLocaleDateString([], { weekday: "long" });
	if (diffDays < 30) return "This Month";
	return date.toLocaleDateString([], { month: "long", year: "numeric" });
}

function groupSessionsByDate(sessions: Session[]): DateGroup[] {
	const groups = new Map<string, Session[]>();
	
	for (const session of sessions) {
		const label = getDateGroupLabel(session.createdAt);
		const existing = groups.get(label) || [];
		existing.push(session);
		groups.set(label, existing);
	}
	
	return Array.from(groups.entries()).map(([label, sessions]) => ({
		label,
		sessions,
	}));
}

function ChevronIcon({ color, expanded }: { color: string; expanded: boolean }) {
	return (
		<Svg 
			width={14} 
			height={14} 
			viewBox="0 0 24 24" 
			fill="none"
			style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}
		>
			<Path
				d="M6 9l6 6 6-6"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
			/>
		</Svg>
	);
}

export const SessionBottomSheet = forwardRef<BottomSheet, SessionBottomSheetProps>(
	function SessionBottomSheet(
		{ sessions, currentSessionId, isLoading, onSelectSession, onNewSession, onClose },
		ref
	) {
		const { colors, isDark } = useTheme();
		const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

		const snapPoints = useMemo(() => ["40%", "65%"], []);
		const dateGroups = useMemo(() => groupSessionsByDate(sessions), [sessions]);

		const toggleGroup = useCallback(async (label: string) => {
			await Haptics.selectionAsync();
			setCollapsedGroups(prev => {
				const next = new Set(prev);
				if (next.has(label)) {
					next.delete(label);
				} else {
					next.add(label);
				}
				return next;
			});
		}, []);

		const handleSheetChanges = useCallback(
			(index: number) => {
				if (index === -1) {
					onClose();
				}
			},
			[onClose]
		);

		const renderBackdrop = useCallback(
			(props: BottomSheetBackdropProps) => (
				<BottomSheetBackdrop
					{...props}
					disappearsOnIndex={-1}
					appearsOnIndex={0}
					opacity={0.3}
					pressBehavior="close"
				/>
			),
			[]
		);

		const handleSelectSession = useCallback(
			async (session: Session) => {
				await Haptics.selectionAsync();
				onSelectSession(session);
			},
			[onSelectSession]
		);

		const handleNewSession = useCallback(async () => {
			await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			onNewSession();
		}, [onNewSession]);

		return (
			<BottomSheet
				ref={ref}
				index={-1}
				snapPoints={snapPoints}
				onChange={handleSheetChanges}
				backdropComponent={renderBackdrop}
				enablePanDownToClose
				backgroundStyle={{
					backgroundColor: colors.background,
					borderTopLeftRadius: 20,
					borderTopRightRadius: 20,
					borderWidth: 1,
					borderBottomWidth: 0,
					borderColor: colors.border,
					shadowColor: "#000",
					shadowOffset: { width: 0, height: -4 },
					shadowOpacity: isDark ? 0.3 : 0.1,
					shadowRadius: 12,
					elevation: 16,
				}}
				handleIndicatorStyle={{
					backgroundColor: colors.mutedForeground,
					width: 40,
				}}
			>
				<View style={styles.header}>
					<Text style={[typography.uiHeader, { color: colors.foreground }]}>
						Sessions
					</Text>
				</View>

				<BottomSheetScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
				>
					<Pressable
						onPress={handleNewSession}
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
							<PlusIcon color={colors.primary} />
							<View style={styles.newSessionText}>
								<Text
									style={[
										typography.uiLabel,
										{ color: colors.primary, fontWeight: "600" },
									]}
								>
									New Session
								</Text>
								<Text
									style={[typography.micro, { color: colors.mutedForeground }]}
								>
									Start a fresh conversation
								</Text>
							</View>
						</View>
					</Pressable>

					{isLoading ? (
						<View style={styles.emptyState}>
							<Text
								style={[typography.uiLabel, { color: colors.mutedForeground }]}
							>
								Loading sessions...
							</Text>
						</View>
					) : sessions.length === 0 ? (
						<View style={styles.emptyState}>
							<Text
								style={[typography.uiLabel, { color: colors.mutedForeground }]}
							>
								No existing sessions
							</Text>
						</View>
					) : (
						dateGroups.map((group) => {
							const isCollapsed = collapsedGroups.has(group.label);
							return (
								<View key={group.label} style={styles.dateGroup}>
									<Pressable
										onPress={() => toggleGroup(group.label)}
										style={styles.dateGroupHeader}
									>
										<Text
											style={[
												typography.micro,
												{ color: colors.mutedForeground, fontWeight: "600" },
											]}
										>
											{group.label}
										</Text>
										<View style={styles.dateGroupHeaderRight}>
											<Text
												style={[
													typography.micro,
													{ color: colors.mutedForeground },
												]}
											>
												{group.sessions.length}
											</Text>
											<ChevronIcon color={colors.mutedForeground} expanded={!isCollapsed} />
										</View>
									</Pressable>
									
									{!isCollapsed && group.sessions.map((session) => {
										const isSelected = session.id === currentSessionId;
										return (
											<Pressable
												key={session.id}
												onPress={() => handleSelectSession(session)}
												style={({ pressed }) => [
													styles.sessionItem,
													{
														borderColor: isSelected
															? colors.primary
															: colors.border,
														backgroundColor: pressed
															? isDark
																? "rgba(255,255,255,0.05)"
																: "rgba(0,0,0,0.03)"
															: isSelected
																? `${colors.primary}08`
																: colors.card,
													},
												]}
											>
												<View style={styles.sessionItemLeft}>
													<ChatIcon
														color={
															isSelected ? colors.primary : colors.mutedForeground
														}
													/>
												</View>
												<View style={styles.sessionItemContent}>
													<Text
														style={[
															typography.uiLabel,
															{
																color: colors.foreground,
																fontWeight: isSelected ? "600" : "400",
															},
														]}
														numberOfLines={1}
													>
														{session.title || `Session ${session.id.slice(0, 8)}`}
													</Text>
													<Text
														style={[
															typography.micro,
															{ color: colors.mutedForeground },
														]}
													>
														{formatSessionTime(session.createdAt)}
														{" • "}
														{session.id.slice(0, 12)}...
													</Text>
												</View>
											</Pressable>
										);
									})}
								</View>
							);
						})
					)}
				</BottomSheetScrollView>
			</BottomSheet>
		);
	}
);

const styles = StyleSheet.create({
	header: {
		paddingHorizontal: 20,
		paddingVertical: 12,
		borderBottomWidth: 0,
	},
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
	},
	dateGroup: {
		marginBottom: 16,
	},
	dateGroupHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingVertical: 8,
		paddingHorizontal: 4,
	},
	dateGroupHeaderRight: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	sessionItem: {
		flexDirection: "row",
		alignItems: "center",
		borderRadius: 10,
		borderWidth: 1,
		padding: 14,
		marginBottom: 8,
	},
	sessionItemLeft: {
		marginRight: 12,
	},
	sessionItemContent: {
		flex: 1,
	},
});

export default SessionBottomSheet;
