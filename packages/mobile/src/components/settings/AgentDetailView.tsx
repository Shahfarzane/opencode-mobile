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
import {
  type Agent,
  type AgentConfig,
  agentsApi,
  isAgentBuiltIn,
  type Provider,
  providersApi,
} from "@/api";
import { ChevronLeft } from "@/components/icons";
import { fontStyle, typography, useTheme } from "@/theme";
import { withOpacity, OPACITY } from "@/utils/colors";
import { agentDetailViewStyles } from "./AgentDetailView.styles";

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
  const [agent, setAgent] = useState<Agent | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [providerId, setProviderId] = useState<string>("");
  const [modelId, setModelId] = useState<string>("");

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
      <View className={agentDetailViewStyles.centered({})}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  const selectedProvider = providers.find((p) => p.id === providerId);

  return (
    <View className={agentDetailViewStyles.container({})}>
      {/* Header */}
      <View className={agentDetailViewStyles.header({})}>
        <Pressable
          onPress={onBack}
          className={agentDetailViewStyles.backButton({})}
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
          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            className={agentDetailViewStyles.saveButton({ disabled: isSaving })}
            style={{ backgroundColor: colors.primary }}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <Text
                style={[
                  typography.meta,
                  fontStyle("500"),
                  { color: colors.primaryForeground },
                ]}
              >
                Save
              </Text>
            )}
          </Pressable>
        )}
      </View>

      <ScrollView
        className={agentDetailViewStyles.scroll({})}
        contentContainerClassName={agentDetailViewStyles.content({})}
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

        {/* Name */}
        <View className={agentDetailViewStyles.field({})}>
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
            className={agentDetailViewStyles.input({})}
            style={[
              typography.uiLabel,
              { color: colors.foreground, borderColor: colors.border },
            ]}
            value={name}
            onChangeText={setName}
            placeholder="my-agent"
            placeholderTextColor={colors.mutedForeground}
            editable={!isBuiltIn && isNewAgent}
          />
        </View>

        {/* Description */}
        <View className={agentDetailViewStyles.field({})}>
          <Text
            style={[
              typography.uiLabel,
              fontStyle("600"),
              { color: colors.foreground },
            ]}
          >
            Description
          </Text>
          <TextInput
            className={agentDetailViewStyles.input({})}
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

        {/* Model */}
        <View
          className={agentDetailViewStyles.section({})}
          style={{ borderTopColor: withOpacity(colors.border, OPACITY.scrim) }}
        >
          <Text
            className="mb-2"
            style={[
              typography.uiLabel,
              fontStyle("600"),
              { color: colors.foreground },
            ]}
          >
            Model
          </Text>
          <Text
            className="mb-3"
            style={[typography.meta, { color: colors.mutedForeground }]}
          >
            Select the provider and model for this agent.
          </Text>

          {/* Provider selector */}
          <View
            className={agentDetailViewStyles.selectList({})}
            style={{ borderColor: withOpacity(colors.border, OPACITY.scrim) }}
          >
            {providers.map((provider, index) => (
              <Pressable
                key={provider.id}
                onPress={() => {
                  if (!isBuiltIn) {
                    setProviderId(provider.id);
                    setModelId("");
                  }
                }}
                className={agentDetailViewStyles.selectItem({
                  hasTopBorder: index > 0,
                })}
                style={[
                  index > 0 && { borderTopColor: withOpacity(colors.border, OPACITY.scrim) },
                  providerId === provider.id && {
                    backgroundColor: withOpacity(colors.primary, OPACITY.active),
                  },
                ]}
              >
                <Text
                  style={[
                    typography.meta,
                    {
                      color:
                        providerId === provider.id
                          ? colors.primary
                          : colors.foreground,
                    },
                    fontStyle(providerId === provider.id ? "600" : "400"),
                  ]}
                >
                  {provider.name}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Model selector */}
          {selectedProvider &&
            selectedProvider.models &&
            selectedProvider.models.length > 0 && (
              <View className="mt-3">
                <Text
                  className="mb-2"
                  style={[typography.meta, { color: colors.mutedForeground }]}
                >
                  Model
                </Text>
                <View
                  className={agentDetailViewStyles.selectList({})}
                  style={{ borderColor: withOpacity(colors.border, OPACITY.scrim) }}
                >
                  {selectedProvider.models.slice(0, 10).map((model, index) => (
                    <Pressable
                      key={model.id}
                      onPress={() => !isBuiltIn && setModelId(model.id)}
                      className={agentDetailViewStyles.selectItem({
                        hasTopBorder: index > 0,
                      })}
                      style={[
                        index > 0 && { borderTopColor: withOpacity(colors.border, OPACITY.scrim) },
                        modelId === model.id && {
                          backgroundColor: withOpacity(colors.primary, OPACITY.active),
                        },
                      ]}
                    >
                      <Text
                        style={[
                          typography.meta,
                          {
                            color:
                              modelId === model.id
                                ? colors.primary
                                : colors.foreground,
                          },
                          fontStyle(modelId === model.id ? "600" : "400"),
                        ]}
                        numberOfLines={1}
                      >
                        {model.name || model.id}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
        </View>

        {/* System Prompt */}
        <View
          className={agentDetailViewStyles.section({})}
          style={{ borderTopColor: withOpacity(colors.border, OPACITY.scrim) }}
        >
          <Text
            className="mb-2"
            style={[
              typography.uiLabel,
              fontStyle("600"),
              { color: colors.foreground },
            ]}
          >
            System prompt
          </Text>
          <TextInput
            className={agentDetailViewStyles.textarea({})}
            style={[
              typography.meta,
              { color: colors.foreground, borderColor: colors.border },
            ]}
            value={prompt}
            onChangeText={setPrompt}
            placeholder="Enter the system prompt..."
            placeholderTextColor={colors.mutedForeground}
            editable={!isBuiltIn}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Delete */}
        {!isBuiltIn && !isNewAgent && (
          <View
            className={agentDetailViewStyles.section({})}
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
