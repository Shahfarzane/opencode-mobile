import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { type GitIdentityProfile, gitApi } from "@/api";
import { CheckIcon, ChevronLeft } from "@/components/icons";
import { Button } from "@/components/ui";
import { fontStyle, typography, useTheme } from "@/theme";
import { withOpacity, OPACITY } from "@/utils/colors";
import { gitIdentityDetailViewStyles } from "./GitIdentityDetailView.styles";

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
      <View className={gitIdentityDetailViewStyles.centered({})}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View className={gitIdentityDetailViewStyles.container({})}>
      {/* Header */}
      <View className={gitIdentityDetailViewStyles.header({})}>
        <Pressable
          onPress={onBack}
          className={gitIdentityDetailViewStyles.backButton({})}
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
        className={gitIdentityDetailViewStyles.scroll({})}
        contentContainerClassName={gitIdentityDetailViewStyles.content({})}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Profile Name */}
        <View className={gitIdentityDetailViewStyles.field({})}>
          <Text
            style={[
              typography.uiLabel,
              fontStyle("600"),
              { color: colors.foreground },
            ]}
          >
            Profile name
          </Text>
          <TextInput
            className={gitIdentityDetailViewStyles.input({})}
            style={[
              typography.uiLabel,
              { color: colors.foreground, borderColor: colors.border },
            ]}
            value={name}
            onChangeText={setName}
            placeholder="Work, Personal, etc."
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        {/* Color */}
        <View className={gitIdentityDetailViewStyles.field({})}>
          <Text
            className="mb-2"
            style={[
              typography.uiLabel,
              fontStyle("600"),
              { color: colors.foreground },
            ]}
          >
            Color
          </Text>
          <View className={gitIdentityDetailViewStyles.colorRow({})}>
            {COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c === color ? null : c)}
                className={gitIdentityDetailViewStyles.colorDot({})}
                style={{ backgroundColor: c }}
              >
                {color === c && <CheckIcon size={14} color="#fff" />}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Git Config */}
        <View
          className={gitIdentityDetailViewStyles.section({})}
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
            Git configuration
          </Text>

          <View className={gitIdentityDetailViewStyles.field({})}>
            <Text style={[typography.meta, { color: colors.mutedForeground }]}>
              User name
            </Text>
            <TextInput
              className={gitIdentityDetailViewStyles.input({})}
              style={[
                typography.uiLabel,
                { color: colors.foreground, borderColor: colors.border },
              ]}
              value={userName}
              onChangeText={setUserName}
              placeholder="John Doe"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="words"
            />
          </View>

          <View className={gitIdentityDetailViewStyles.field({})}>
            <Text style={[typography.meta, { color: colors.mutedForeground }]}>
              Email
            </Text>
            <TextInput
              className={gitIdentityDetailViewStyles.input({})}
              style={[
                typography.uiLabel,
                { color: colors.foreground, borderColor: colors.border },
              ]}
              value={userEmail}
              onChangeText={setUserEmail}
              placeholder="john@example.com"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* SSH Key */}
        <View
          className={gitIdentityDetailViewStyles.section({})}
          style={{ borderTopColor: withOpacity(colors.border, OPACITY.scrim) }}
        >
          <Text
            className="mb-1"
            style={[
              typography.uiLabel,
              fontStyle("600"),
              { color: colors.foreground },
            ]}
          >
            SSH key path
          </Text>
          <Text
            className="mb-2"
            style={[typography.micro, { color: colors.mutedForeground }]}
          >
            Optional path to SSH key for this identity
          </Text>
          <TextInput
            className={gitIdentityDetailViewStyles.input({})}
            style={[
              typography.uiLabel,
              { color: colors.foreground, borderColor: colors.border },
            ]}
            value={sshKey}
            onChangeText={setSshKey}
            placeholder="~/.ssh/id_ed25519"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Delete */}
        {!isNewProfile && (
          <View
            className={gitIdentityDetailViewStyles.section({})}
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
