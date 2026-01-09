import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type GitIdentityProfile, gitApi } from "@/api";
import { CheckIcon, ChevronLeft } from "@/components/icons";
import { Button, Input } from "@/components/ui";
import { fontStyle, Spacing, typography, useTheme } from "@/theme";
import { withOpacity, OPACITY } from "@/utils/colors";

interface GitIdentityDetailViewProps {
  profileId: string;
  onBack: () => void;
  onDeleted?: () => void;
}

const COLORS = [
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
  const insets = useSafeAreaInsets();
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

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
      } else {
        await gitApi.updateIdentity(profileId, profileData);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onBack();
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to save git identity"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
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
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
              onDeleted?.();
              onBack();
            } catch (error) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert(
                "Error",
                error instanceof Error ? error.message : "Failed to delete"
              );
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-4 py-2"
        style={{ paddingTop: insets.top + Spacing.sm }}
      >
        <Pressable
          onPress={onBack}
          className="flex-row items-center gap-2"
          hitSlop={8}
        >
          <ChevronLeft size={18} color={colors.foreground} />
          <Text
            style={[
              typography.uiLabel,
              fontStyle("600"),
              { color: colors.foreground },
            ]}
          >
            {isNewProfile ? "New Identity" : name || "Git Identity"}
          </Text>
        </Pressable>
        <Button
          variant="primary"
          size="sm"
          onPress={handleSave}
          isDisabled={isSaving}
          isLoading={isSaving}
        >
          <Button.Label>Save</Button.Label>
        </Button>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-8"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Profile Name */}
        <View className="mb-5">
          <Input
            label="Profile Name"
            value={name}
            onChangeText={setName}
            placeholder="Work, Personal, etc."
            helperText="A friendly name to identify this profile"
          />
        </View>

        {/* Color */}
        <View className="mb-5">
          <Text
            className="mb-1.5"
            style={[
              typography.uiLabel,
              fontStyle("600"),
              { color: colors.foreground },
            ]}
          >
            Color
          </Text>
          <Text
            className="mb-2"
            style={[typography.micro, { color: colors.mutedForeground }]}
          >
            Visual indicator for this profile
          </Text>
          <View className="flex-row gap-3 flex-wrap">
            {COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c === color ? null : c)}
                className="w-9 h-9 rounded-full items-center justify-center"
                style={[
                  { backgroundColor: c },
                  color === c && {
                    borderWidth: 3,
                    borderColor: colors.foreground,
                  },
                ]}
              >
                {color === c && <CheckIcon size={16} color="#fff" />}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Git Configuration Section */}
        <View
          className="pt-5 border-t mb-5"
          style={{ borderTopColor: withOpacity(colors.border, OPACITY.scrim) }}
        >
          <Text
            className="mb-3"
            style={[
              typography.uiLabel,
              fontStyle("600"),
              { color: colors.foreground },
            ]}
          >
            Git Configuration
          </Text>

          {/* User Name */}
          <View className="mb-4">
            <Input
              label={<Text>User Name <Text style={{ color: colors.destructive }}>*</Text></Text>}
              value={userName}
              onChangeText={setUserName}
              placeholder="John Doe"
              autoCapitalize="words"
              helperText="The name that appears in commit messages"
            />
          </View>

          {/* Email */}
          <View>
            <Input
              label={<Text>Email <Text style={{ color: colors.destructive }}>*</Text></Text>}
              value={userEmail}
              onChangeText={setUserEmail}
              placeholder="john@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              helperText="The email that appears in commit messages"
            />
          </View>
        </View>

        {/* SSH Key Section */}
        <View
          className="pt-5 border-t mb-5"
          style={{ borderTopColor: withOpacity(colors.border, OPACITY.scrim) }}
        >
          <Input
            label="SSH Key Path"
            value={sshKey}
            onChangeText={setSshKey}
            placeholder="~/.ssh/id_ed25519"
            autoCapitalize="none"
            autoCorrect={false}
            helperText="Optional path to SSH key for this identity"
          />
        </View>

        {/* Delete */}
        {!isNewProfile && (
          <View
            className="pt-5 border-t"
            style={{ borderTopColor: withOpacity(colors.border, OPACITY.scrim) }}
          >
            <Pressable onPress={handleDelete}>
              <Text style={[typography.meta, { color: colors.destructive }]}>
                Delete identity
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
