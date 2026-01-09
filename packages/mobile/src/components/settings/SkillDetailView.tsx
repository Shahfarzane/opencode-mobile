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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  type Skill,
  type SkillConfig,
  skillsApi,
  isSkillBuiltIn,
} from "@/api";
import { ChevronLeft, FolderIcon, GlobeIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { fontStyle, Spacing, typography, useTheme } from "@/theme";
import { withOpacity, OPACITY } from "@/utils/colors";
import { skillDetailViewStyles } from "./SkillDetailView.styles";

type SkillScope = "user" | "project";

interface SkillDetailViewProps {
  skillName: string;
  onBack: () => void;
  onDeleted?: () => void;
}

export function SkillDetailView({
  skillName,
  onBack,
  onDeleted,
}: SkillDetailViewProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [skill, setSkill] = useState<Skill | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [template, setTemplate] = useState("");
  const [scope, setScope] = useState<SkillScope>("user");

  const isBuiltIn = skill ? isSkillBuiltIn(skill) : false;
  const isNewSkill = skillName === "__new__";

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const skillsList = await skillsApi.list();

      if (!isNewSkill) {
        const foundSkill = skillsList.find((s) => s.name === skillName);
        if (foundSkill) {
          setSkill(foundSkill);
          setName(foundSkill.name);
          setDescription(foundSkill.description ?? "");
          setTemplate(foundSkill.template ?? "");
        }
      }
    } catch (error) {
      console.error("Failed to load skill:", error);
      Alert.alert("Error", "Failed to load skill details");
    } finally {
      setIsLoading(false);
    }
  }, [skillName, isNewSkill]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Skill name is required");
      return;
    }

    // Validate skill name format
    const trimmedName = name.trim().toLowerCase().replace(/\s+/g, "-");
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(trimmedName) || trimmedName.length > 64) {
      Alert.alert("Error", "Skill name must be 1-64 lowercase alphanumeric characters with hyphens, cannot start or end with hyphen");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Error", "Description is required");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSaving(true);
    try {
      const config: SkillConfig = {
        name: trimmedName,
        description: description.trim(),
        template: template.trim() || undefined,
        scope: isNewSkill ? scope : undefined,
      };

      let success: boolean;
      if (isNewSkill) {
        success = await skillsApi.create(config);
      } else {
        success = await skillsApi.update(skillName, config);
      }

      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onBack();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Error", "Failed to save skill");
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to save skill"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Delete Skill",
      `Are you sure you want to delete "${skillName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsSaving(true);
            try {
              const success = await skillsApi.delete(skillName);
              if (success) {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success
                );
                onDeleted?.();
                onBack();
              } else {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Error
                );
                Alert.alert("Error", "Failed to delete skill");
              }
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
      <View className={skillDetailViewStyles.centered({})}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View className={skillDetailViewStyles.container({})}>
      {/* Header */}
      <View
        className={skillDetailViewStyles.header({})}
        style={{ paddingTop: insets.top + Spacing.sm }}
      >
        <Pressable
          onPress={onBack}
          className={skillDetailViewStyles.backButton({})}
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
            {isNewSkill ? "New Skill" : skillName}
          </Text>
        </Pressable>
        {!isBuiltIn && (
          <Button
            variant="primary"
            size="sm"
            onPress={handleSave}
            isDisabled={isSaving}
            isLoading={isSaving}
          >
            <Button.Label>Save</Button.Label>
          </Button>
        )}
      </View>

      <ScrollView
        className={skillDetailViewStyles.scroll({})}
        contentContainerClassName={skillDetailViewStyles.content({})}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isBuiltIn && (
          <Text
            className="mb-4"
            style={[typography.meta, { color: colors.mutedForeground }]}
          >
            Built-in skill (read-only)
          </Text>
        )}

        {/* Name */}
        <View className={skillDetailViewStyles.field({})}>
          <Text
            style={[
              typography.uiLabel,
              fontStyle("600"),
              { color: colors.foreground },
            ]}
          >
            Name
          </Text>
          <TextInput
            className={skillDetailViewStyles.input({})}
            style={[
              typography.uiLabel,
              { color: colors.foreground, borderColor: colors.border },
            ]}
            value={name}
            onChangeText={setName}
            placeholder="skill-name"
            placeholderTextColor={colors.mutedForeground}
            editable={!isBuiltIn && isNewSkill}
            autoCapitalize="none"
          />
          <Text
            style={[typography.micro, { color: colors.mutedForeground }]}
          >
            Lowercase letters, numbers, and hyphens only
          </Text>
        </View>

        {/* Scope - only for new skills */}
        {isNewSkill && (
          <View className={skillDetailViewStyles.field({})}>
            <Text
              style={[
                typography.uiLabel,
                fontStyle("600"),
                { color: colors.foreground },
              ]}
            >
              Scope
            </Text>
            <Text
              className="mb-2"
              style={[typography.micro, { color: colors.mutedForeground }]}
            >
              Where to save this skill
            </Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setScope("user")}
                className="flex-row items-center px-3 py-2 rounded-lg border"
                style={[
                  { borderColor: scope === "user" ? colors.primary : colors.border },
                  scope === "user" && { backgroundColor: withOpacity(colors.primary, OPACITY.active) },
                ]}
              >
                <GlobeIcon size={16} color={scope === "user" ? colors.primary : colors.mutedForeground} />
                <Text
                  style={[
                    typography.meta,
                    { marginLeft: 6 },
                    { color: scope === "user" ? colors.primary : colors.foreground },
                    fontStyle(scope === "user" ? "600" : "400"),
                  ]}
                >
                  User
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setScope("project")}
                className="flex-row items-center px-3 py-2 rounded-lg border"
                style={[
                  { borderColor: scope === "project" ? colors.primary : colors.border },
                  scope === "project" && { backgroundColor: withOpacity(colors.primary, OPACITY.active) },
                ]}
              >
                <FolderIcon size={16} color={scope === "project" ? colors.primary : colors.mutedForeground} />
                <Text
                  style={[
                    typography.meta,
                    { marginLeft: 6 },
                    { color: scope === "project" ? colors.primary : colors.foreground },
                    fontStyle(scope === "project" ? "600" : "400"),
                  ]}
                >
                  Project
                </Text>
              </Pressable>
            </View>
            <Text
              className="mt-1"
              style={[typography.micro, { color: colors.mutedForeground }]}
            >
              {scope === "user" ? "Available in all projects" : "Only in current project"}
            </Text>
          </View>
        )}

        {/* Description */}
        <View className={skillDetailViewStyles.field({})}>
          <Text
            style={[
              typography.uiLabel,
              fontStyle("600"),
              { color: colors.foreground },
            ]}
          >
            Description <Text style={{ color: colors.destructive }}>*</Text>
          </Text>
          <TextInput
            className={skillDetailViewStyles.textarea({})}
            style={[
              typography.uiLabel,
              { color: colors.foreground, borderColor: colors.border },
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder="Brief description of what this skill does..."
            placeholderTextColor={colors.mutedForeground}
            editable={!isBuiltIn}
            multiline
            textAlignVertical="top"
          />
          <Text
            style={[typography.micro, { color: colors.mutedForeground }]}
          >
            The agent uses this to decide when to load the skill
          </Text>
        </View>

        {/* Instructions / Template */}
        <View
          className={skillDetailViewStyles.section({})}
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
            Instructions
          </Text>
          <Text
            className="mb-2"
            style={[typography.micro, { color: colors.mutedForeground }]}
          >
            Detailed instructions for the agent when this skill is loaded
          </Text>
          <TextInput
            className={skillDetailViewStyles.instructionsTextarea({})}
            style={[
              typography.meta,
              { color: colors.foreground, borderColor: colors.border },
            ]}
            value={template}
            onChangeText={setTemplate}
            placeholder="Step-by-step instructions, guidelines, or reference content..."
            placeholderTextColor={colors.mutedForeground}
            editable={!isBuiltIn}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Delete */}
        {!isBuiltIn && !isNewSkill && (
          <View
            className={skillDetailViewStyles.section({})}
            style={{ borderTopColor: withOpacity(colors.border, OPACITY.scrim) }}
          >
            <Pressable onPress={handleDelete}>
              <Text style={[typography.meta, { color: colors.destructive }]}>
                Delete skill
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
