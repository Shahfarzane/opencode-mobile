import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { type GitIdentityProfile, gitApi } from "@/api";
import { typography, useTheme } from "@/theme";
import { SettingsSection } from "./SettingsSection";
import { SettingsTextArea, SettingsTextField } from "./shared";

interface GitIdentityDetailViewProps {
	profileId: string;
	onBack: () => void;
	onDeleted?: () => void;
}

const COLOR_OPTIONS = [
	"#ef4444",
	"#f97316",
	"#eab308",
	"#22c55e",
	"#14b8a6",
	"#3b82f6",
	"#8b5cf6",
	"#ec4899",
];

export function GitIdentityDetailView({
	profileId,
	onBack,
	onDeleted,
}: GitIdentityDetailViewProps) {
	const { colors } = useTheme();
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);

	const [name, setName] = useState("");
	const [userName, setUserName] = useState("");
	const [userEmail, setUserEmail] = useState("");
	const [sshKey, setSshKey] = useState("");
	const [color, setColor] = useState<string | null>(null);

	const isNewProfile = profileId === "__new__";

	const loadProfile = useCallback(async () => {
		setIsLoading(true);
		try {
			if (!isNewProfile) {
				const profiles = await gitApi.getIdentities();
				const foundProfile = profiles.find((p) => p.id === profileId);
				if (foundProfile) {
					setName(foundProfile.name);
					setUserName(foundProfile.userName);
					setUserEmail(foundProfile.userEmail);
					setSshKey(foundProfile.sshKey ?? "");
					setColor(foundProfile.color ?? null);
				}
			}
		} catch (error) {
			console.error("Failed to load git identity:", error);
			Alert.alert("Error", "Failed to load git identity details");
		} finally {
			setIsLoading(false);
		}
	}, [profileId, isNewProfile]);

	useEffect(() => {
		loadProfile();
	}, [loadProfile]);

	const handleSave = async () => {
		if (!name.trim()) {
			Alert.alert("Error", "Profile name is required");
			return;
		}
		if (!userName.trim()) {
			Alert.alert("Error", "Git user name is required");
			return;
		}
		if (!userEmail.trim()) {
			Alert.alert("Error", "Git email is required");
			return;
		}

		setIsSaving(true);
		try {
			const profileData: GitIdentityProfile = {
				id: isNewProfile ? `profile-${Date.now()}` : profileId,
				name: name.trim(),
				userName: userName.trim(),
				userEmail: userEmail.trim(),
				sshKey: sshKey.trim() || null,
				color: color,
			};

			if (isNewProfile) {
				await gitApi.createIdentity(profileData);
				Alert.alert("Success", "Git identity created");
			} else {
				await gitApi.updateIdentity(profileId, profileData);
				Alert.alert("Success", "Git identity updated");
			}
			onBack();
		} catch (error) {
			Alert.alert(
				"Error",
				error instanceof Error ? error.message : "Failed to save git identity",
			);
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = () => {
		Alert.alert(
			"Delete Git Identity",
			`Are you sure you want to delete "${name}"?`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						setIsSaving(true);
						try {
							await gitApi.deleteIdentity(profileId);
							onDeleted?.();
							onBack();
						} catch (error) {
							Alert.alert(
								"Error",
								error instanceof Error ? error.message : "Failed to delete",
							);
						} finally {
							setIsSaving(false);
						}
					},
				},
			],
		);
	};

	if (isLoading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color={colors.primary} />
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<View style={[styles.header, { borderBottomColor: colors.border }]}>
				<Pressable onPress={onBack} style={styles.backButton}>
					<Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
						<Path
							d="M15 18l-6-6 6-6"
							stroke={colors.foreground}
							strokeWidth={2}
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</Svg>
				</Pressable>
				<Text style={[typography.uiLabel, styles.headerTitle, { color: colors.foreground }]}>
					{isNewProfile ? "New Git Identity" : name || "Git Identity"}
				</Text>
				<Pressable
					onPress={handleSave}
					disabled={isSaving}
					style={[styles.saveButton, { backgroundColor: colors.primary }]}
				>
					{isSaving ? (
						<ActivityIndicator size="small" color={colors.background} />
					) : (
						<Text style={[typography.uiLabel, { color: colors.background }]}>
							Save
						</Text>
					)}
				</Pressable>
			</View>

			<ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
				<SettingsSection title="Profile" showDivider={false}>
					<View style={styles.formGroup}>
						<SettingsTextField
							label="Profile Name"
							description="A friendly name to identify this identity"
							value={name}
							onChangeText={setName}
							placeholder="Work, Personal, etc."
							required
						/>
					</View>
					<View style={styles.formGroup}>
						<Text style={[typography.uiLabel, { color: colors.foreground, marginBottom: 6 }]}>
							Color
						</Text>
						<Text style={[typography.meta, { color: colors.mutedForeground, marginBottom: 12 }]}>
							Choose a color to identify this profile
						</Text>
						<View style={styles.colorPicker}>
							{COLOR_OPTIONS.map((c) => (
								<Pressable
									key={c}
									onPress={() => setColor(c === color ? null : c)}
									style={[
										styles.colorOption,
										{ backgroundColor: c },
										color === c && styles.colorSelected,
									]}
								>
									{color === c && (
										<Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
											<Path
												d="M20 6L9 17l-5-5"
												stroke="#fff"
												strokeWidth={3}
												strokeLinecap="round"
												strokeLinejoin="round"
											/>
										</Svg>
									)}
								</Pressable>
							))}
						</View>
					</View>
				</SettingsSection>

				<SettingsSection title="Git Configuration">
					<View style={styles.formGroup}>
						<SettingsTextField
							label="User Name"
							description="The name used in git commits"
							value={userName}
							onChangeText={setUserName}
							placeholder="John Doe"
							autoCapitalize="words"
							required
						/>
					</View>
					<View style={styles.formGroup}>
						<SettingsTextField
							label="Email"
							description="The email used in git commits"
							value={userEmail}
							onChangeText={setUserEmail}
							placeholder="john@example.com"
							keyboardType="email-address"
							autoCapitalize="none"
							autoCorrect={false}
							required
						/>
					</View>
				</SettingsSection>

				<SettingsSection title="SSH Key (Optional)">
					<Text style={[typography.meta, { color: colors.mutedForeground, marginBottom: 12 }]}>
						Path to the SSH key file for this identity
					</Text>
					<View style={styles.formGroup}>
						<SettingsTextArea
							label="SSH Key Path"
							value={sshKey}
							onChangeText={setSshKey}
							placeholder="~/.ssh/id_ed25519"
							autoCapitalize="none"
							autoCorrect={false}
							rows={2}
						/>
					</View>
				</SettingsSection>

				{!isNewProfile && (
					<SettingsSection title="Danger Zone">
						<Pressable
							onPress={handleDelete}
							style={[styles.deleteButton, { borderColor: colors.destructive }]}
						>
							<Text style={[typography.uiLabel, { color: colors.destructive }]}>
								Delete Git Identity
							</Text>
						</Pressable>
					</SettingsSection>
				)}

				<View style={styles.bottomSpacer} />
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	loadingContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		borderBottomWidth: 1,
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	backButton: {
		padding: 4,
		marginRight: 12,
		marginLeft: -4,
	},
	headerTitle: {
		flex: 1,
		fontWeight: "600",
	},
	saveButton: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 6,
		minWidth: 60,
		alignItems: "center",
	},
	scrollView: {
		flex: 1,
	},
	content: {
		padding: 16,
	},
	formGroup: {
		marginBottom: 16,
	},
	colorPicker: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 12,
	},
	colorOption: {
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: "center",
		justifyContent: "center",
	},
	colorSelected: {
		borderWidth: 3,
		borderColor: "rgba(255,255,255,0.5)",
	},
	deleteButton: {
		borderWidth: 1,
		borderRadius: 8,
		paddingVertical: 12,
		alignItems: "center",
	},
	bottomSpacer: {
		height: 40,
	},
});
