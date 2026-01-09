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
  type Agent,
  type AgentConfig,
  agentsApi,
  isAgentBuiltIn,
  type Provider,
  providersApi,
} from "@/api";
import { AiAgentIcon, ChevronLeft, FolderIcon, GlobeIcon, RobotIcon, AiAgentFillIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { fontStyle, typography, useTheme } from "@/theme";
import { withOpacity, OPACITY } from "@/utils/colors";
import { ModelSelector } from "./ModelSelector";

type AgentScope = "user" | "project";
type AgentMode = "primary" | "subagent" | "all";

interface AgentDetailViewProps {
  agentName: string;
  onBack: () => void;
  onDeleted?: () => void;
}

export function AgentDetailView({
  agentName,
  onBack,
  onDeleted,
}: AgentDetailViewProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [providerId, setProviderId] = useState<string>("");
  const [modelId, setModelId] = useState<string>("");
  const [scope, setScope] = useState<AgentScope>("user");
  const [mode, setMode] = useState<AgentMode>("subagent");

  const isBuiltIn = agent ? isAgentBuiltIn(agent) : false;
  const isNewAgent = agentName === "__new__";

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [agentsList, providersList] = await Promise.all([
        agentsApi.list(),
        providersApi.list(),
      ]);

      setProviders(providersList);

      if (!isNewAgent) {
        const foundAgent = agentsList.find((a) => a.name === agentName);
        if (foundAgent) {
          setAgent(foundAgent);
          setName(foundAgent.name);
          setDescription(foundAgent.description ?? "");
          setPrompt(foundAgent.prompt ?? "");
          setProviderId(foundAgent.model?.providerID ?? "");
          setModelId(foundAgent.model?.modelID ?? "");
          setMode(foundAgent.mode ?? "subagent");
        }
      }
    } catch (error) {
      console.error("Failed to load agent:", error);
      Alert.alert("Error", "Failed to load agent details");
    } finally {
      setIsLoading(false);
    }
  }, [agentName, isNewAgent]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Agent name is required");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSaving(true);
    try {
      const config: AgentConfig = {
        name: name.trim(),
        description: description.trim() || undefined,
        prompt: prompt.trim() || undefined,
        model: providerId && modelId ? `${providerId}/${modelId}` : undefined,
        mode,
        scope: isNewAgent ? scope : undefined,
      };

      let success: boolean;
      if (isNewAgent) {
        success = await agentsApi.create(config);
      } else {
        success = await agentsApi.update(agentName, config);
      }

      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onBack();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Error", "Failed to save agent");
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to save agent"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Delete Agent",
      `Are you sure you want to delete "${agentName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsSaving(true);
            try {
              const success = await agentsApi.delete(agentName);
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
                Alert.alert("Error", "Failed to delete agent");
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
        style={{ paddingTop: insets.top + 8 }}
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
            {isNewAgent ? "New Agent" : agentName}
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
        className="flex-1"
        contentContainerClassName="px-4 pb-8"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isBuiltIn && (
          <Text
            className="mb-4"
            style={[typography.meta, { color: colors.mutedForeground }]}
          >
            Built-in agent (read-only)
          </Text>
        )}

        {/* Name Field */}
        <View className="mb-5">
          <Text
            className="mb-1.5"
            style={[
              typography.uiLabel,
              fontStyle("600"),
              { color: colors.foreground },
            ]}
          >
            Name
          </Text>
          <View
            className="flex-row items-center rounded-lg border overflow-hidden"
            style={{ borderColor: colors.border }}
          >
            <View
              className="px-3 py-2.5"
              style={{ backgroundColor: withOpacity(colors.muted, OPACITY.scrim) }}
            >
              <Text style={[typography.uiLabel, { color: colors.mutedForeground }]}>
                @
              </Text>
            </View>
            <TextInput
              className="flex-1 px-3 py-2.5"
              style={[typography.uiLabel, { color: colors.foreground }]}
              value={name}
              onChangeText={setName}
              placeholder="agent-name"
              placeholderTextColor={colors.mutedForeground}
              editable={!isBuiltIn && isNewAgent}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Scope - only for new agents */}
        {isNewAgent && (
          <View className="mb-5">
            <Text
              className="mb-1.5"
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
              Where to save this agent
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

        {/* Mode */}
        <View className="mb-5">
          <Text
            className="mb-1.5"
            style={[
              typography.uiLabel,
              fontStyle("600"),
              { color: colors.foreground },
            ]}
          >
            Mode
          </Text>
          <Text
            className="mb-2"
            style={[typography.micro, { color: colors.mutedForeground }]}
          >
            How this agent can be used
          </Text>
          <View className="flex-row gap-2 flex-wrap">
            <Pressable
              onPress={() => !isBuiltIn && setMode("primary")}
              className="flex-row items-center px-3 py-2 rounded-lg border"
              style={[
                { borderColor: mode === "primary" ? colors.primary : colors.border },
                mode === "primary" && { backgroundColor: withOpacity(colors.primary, OPACITY.active) },
              ]}
            >
              <AiAgentIcon size={16} color={mode === "primary" ? colors.primary : colors.mutedForeground} />
              <Text
                style={[
                  typography.meta,
                  { marginLeft: 6 },
                  { color: mode === "primary" ? colors.primary : colors.foreground },
                  fontStyle(mode === "primary" ? "600" : "400"),
                ]}
              >
                Primary
              </Text>
            </Pressable>
            <Pressable
              onPress={() => !isBuiltIn && setMode("subagent")}
              className="flex-row items-center px-3 py-2 rounded-lg border"
              style={[
                { borderColor: mode === "subagent" ? colors.primary : colors.border },
                mode === "subagent" && { backgroundColor: withOpacity(colors.primary, OPACITY.active) },
              ]}
            >
              <RobotIcon size={16} color={mode === "subagent" ? colors.primary : colors.mutedForeground} />
              <Text
                style={[
                  typography.meta,
                  { marginLeft: 6 },
                  { color: mode === "subagent" ? colors.primary : colors.foreground },
                  fontStyle(mode === "subagent" ? "600" : "400"),
                ]}
              >
                Subagent
              </Text>
            </Pressable>
            <Pressable
              onPress={() => !isBuiltIn && setMode("all")}
              className="flex-row items-center px-3 py-2 rounded-lg border"
              style={[
                { borderColor: mode === "all" ? colors.primary : colors.border },
                mode === "all" && { backgroundColor: withOpacity(colors.primary, OPACITY.active) },
              ]}
            >
              <AiAgentFillIcon size={16} color={mode === "all" ? colors.primary : colors.mutedForeground} />
              <Text
                style={[
                  typography.meta,
                  { marginLeft: 6 },
                  { color: mode === "all" ? colors.primary : colors.foreground },
                  fontStyle(mode === "all" ? "600" : "400"),
                ]}
              >
                All
              </Text>
            </Pressable>
          </View>
          <Text
            className="mt-1"
            style={[typography.micro, { color: colors.mutedForeground }]}
          >
            {mode === "primary" ? "Main agent for conversations" : mode === "subagent" ? "Helper agent for tasks" : "Both primary and subagent modes"}
          </Text>
        </View>

        {/* Description */}
        <View className="mb-5">
          <Text
            className="mb-1.5"
            style={[
              typography.uiLabel,
              fontStyle("600"),
              { color: colors.foreground },
            ]}
          >
            Description
          </Text>
          <TextInput
            className="px-3 py-2.5 rounded-lg border"
            style={[
              typography.uiLabel,
              { color: colors.foreground, borderColor: colors.border },
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder="What this agent does..."
            placeholderTextColor={colors.mutedForeground}
            editable={!isBuiltIn}
          />
        </View>

        {/* Model Section */}
        <View
          className="pt-5 border-t mb-5"
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
            Model
          </Text>
          <Text
            className="mb-2"
            style={[typography.micro, { color: colors.mutedForeground }]}
          >
            Select provider and model for this agent
          </Text>
          <ModelSelector
            providers={providers}
            providerId={providerId}
            modelId={modelId}
            onChange={(provId, modId) => {
              setProviderId(provId);
              setModelId(modId);
            }}
            disabled={isBuiltIn}
          />
        </View>

        {/* System Prompt */}
        <View
          className="pt-5 border-t mb-5"
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
            System Prompt
          </Text>
          <Text
            className="mb-2"
            style={[typography.micro, { color: colors.mutedForeground }]}
          >
            Custom instructions for this agent
          </Text>
          <TextInput
            className="px-3 py-3 rounded-lg border"
            style={[
              typography.meta,
              {
                color: colors.foreground,
                borderColor: colors.border,
                minHeight: 150,
                textAlignVertical: "top",
              },
            ]}
            value={prompt}
            onChangeText={setPrompt}
            placeholder="Enter the system prompt..."
            placeholderTextColor={colors.mutedForeground}
            editable={!isBuiltIn}
            multiline
          />
        </View>

        {/* Delete */}
        {!isBuiltIn && !isNewAgent && (
          <View
            className="pt-5 border-t"
            style={{ borderTopColor: withOpacity(colors.border, OPACITY.scrim) }}
          >
            <Pressable onPress={handleDelete}>
              <Text style={[typography.meta, { color: colors.destructive }]}>
                Delete agent
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
