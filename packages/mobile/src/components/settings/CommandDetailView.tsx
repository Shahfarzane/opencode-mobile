import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  type Agent,
  agentsApi,
  type Command,
  type CommandConfig,
  commandsApi,
  isCommandBuiltIn,
  type Provider,
  providersApi,
} from "@/api";
import { CheckIcon, ChevronLeft, FolderIcon, GlobeIcon } from "@/components/icons";
import { Button, Input } from "@/components/ui";
import { fontStyle, Spacing, typography, useTheme } from "@/theme";
import { withOpacity, OPACITY } from "@/utils/colors";
import { ModelSelector } from "./ModelSelector";

type CommandScope = "user" | "project";

interface CommandDetailViewProps {
  commandName: string;
  onBack: () => void;
  onDeleted?: () => void;
}

export function CommandDetailView({
  commandName,
  onBack,
  onDeleted,
}: CommandDetailViewProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [command, setCommand] = useState<Command | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [template, setTemplate] = useState("");
  const [agentName, setAgentName] = useState("");
  const [providerId, setProviderId] = useState("");
  const [modelId, setModelId] = useState("");
  const [subtask, setSubtask] = useState(false);
  const [scope, setScope] = useState<CommandScope>("user");

  const isBuiltIn = command ? isCommandBuiltIn(command) : false;
  const isNewCommand = commandName === "__new__";

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [commandsList, agentsList, providersList] = await Promise.all([
        commandsApi.list(),
        agentsApi.list(),
        providersApi.list(),
      ]);

      setAgents(agentsList.filter((a) => !a.hidden));
      setProviders(providersList);

      if (!isNewCommand) {
        const foundCommand = commandsList.find((c) => c.name === commandName);
        if (foundCommand) {
          setCommand(foundCommand);
          setName(foundCommand.name);
          setDescription(foundCommand.description ?? "");
          setTemplate(foundCommand.template ?? "");
          setAgentName(foundCommand.agent ?? "");
          setSubtask(foundCommand.subtask ?? false);
          // Parse model string like "provider/model"
          if (foundCommand.model) {
            const parts = foundCommand.model.split("/");
            if (parts.length >= 2) {
              setProviderId(parts[0]);
              setModelId(parts.slice(1).join("/"));
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to load command:", error);
      Alert.alert("Error", "Failed to load command details");
    } finally {
      setIsLoading(false);
    }
  }, [commandName, isNewCommand]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Command name is required");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSaving(true);
    try {
      const config: CommandConfig = {
        name: name.trim(),
        description: description.trim() || undefined,
        template: template.trim() || undefined,
        agent: agentName || undefined,
        model: providerId && modelId ? `${providerId}/${modelId}` : undefined,
        subtask: subtask || undefined,
        scope: isNewCommand ? scope : undefined,
      };

      let success: boolean;
      if (isNewCommand) {
        success = await commandsApi.create(config);
      } else {
        success = await commandsApi.update(commandName, config);
      }

      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onBack();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Error", "Failed to save command");
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to save command"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Delete Command",
      `Are you sure you want to delete "/${commandName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsSaving(true);
            try {
              const success = await commandsApi.delete(commandName);
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
                Alert.alert("Error", "Failed to delete command");
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
            {isNewCommand ? "New Command" : `/${commandName}`}
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
            Built-in command (read-only)
          </Text>
        )}

        {/* Name Field */}
        <View className="mb-5">
          <Input
            label="Name"
            prefix="/"
            value={name}
            onChangeText={setName}
            placeholder="command-name"
            editable={!isBuiltIn && isNewCommand}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Scope - only for new commands */}
        {isNewCommand && (
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
              Where to save this command
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

        {/* Description Field */}
        <View className="mb-5">
          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="What this command does..."
            editable={!isBuiltIn}
          />
        </View>

        {/* Template Section */}
        <View
          className="pt-5 border-t mb-5"
          style={{ borderTopColor: withOpacity(colors.border, OPACITY.scrim) }}
        >
          <Input
            label="Template"
            value={template}
            onChangeText={setTemplate}
            placeholder="Do something with $ARGUMENTS..."
            editable={!isBuiltIn}
            multiline
            numberOfLines={5}
            helperText="Use $ARGUMENTS for user input"
          />
        </View>

        {/* Agent Section */}
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
            Agent
          </Text>
          <Text
            className="mb-2"
            style={[typography.micro, { color: colors.mutedForeground }]}
          >
            Agent to execute this command (optional)
          </Text>
          <View
            className="border rounded-lg overflow-hidden"
            style={{ borderColor: colors.border }}
          >
            <Pressable
              onPress={() => !isBuiltIn && setAgentName("")}
              className="px-3 py-2.5"
              style={!agentName ? { backgroundColor: withOpacity(colors.primary, OPACITY.active) } : undefined}
            >
              <View className="flex-row items-center justify-between">
                <Text
                  style={[
                    typography.meta,
                    { color: !agentName ? colors.primary : colors.mutedForeground },
                  ]}
                >
                  None
                </Text>
                {!agentName && <CheckIcon size={14} color={colors.primary} />}
              </View>
            </Pressable>
            {agents.map((agent) => (
              <Pressable
                key={agent.name}
                onPress={() => !isBuiltIn && setAgentName(agent.name)}
                className="px-3 py-2.5 border-t"
                style={[
                  { borderTopColor: withOpacity(colors.border, OPACITY.scrim) },
                  agentName === agent.name && {
                    backgroundColor: withOpacity(colors.primary, OPACITY.active),
                  },
                ]}
              >
                <View className="flex-row items-center justify-between">
                  <Text
                    style={[
                      typography.meta,
                      {
                        color:
                          agentName === agent.name
                            ? colors.primary
                            : colors.foreground,
                      },
                      fontStyle(agentName === agent.name ? "600" : "400"),
                    ]}
                  >
                    {agent.name}
                  </Text>
                  {agentName === agent.name && (
                    <CheckIcon size={14} color={colors.primary} />
                  )}
                </View>
              </Pressable>
            ))}
          </View>
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
            Select provider and model for this command (optional)
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

        {/* Subtask Toggle */}
        <View
          className="pt-5 border-t mb-5"
          style={{ borderTopColor: withOpacity(colors.border, OPACITY.scrim) }}
        >
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <Text
                style={[
                  typography.uiLabel,
                  fontStyle("600"),
                  { color: colors.foreground },
                ]}
              >
                Run as subtask
              </Text>
              <Text
                style={[typography.micro, { color: colors.mutedForeground }]}
              >
                Execute in a separate context
              </Text>
            </View>
            <Switch
              value={subtask}
              onValueChange={setSubtask}
              disabled={isBuiltIn}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={colors.card}
            />
          </View>
        </View>

        {/* Delete */}
        {!isBuiltIn && !isNewCommand && (
          <View
            className="pt-5 border-t"
            style={{ borderTopColor: withOpacity(colors.border, OPACITY.scrim) }}
          >
            <Pressable onPress={handleDelete}>
              <Text style={[typography.meta, { color: colors.destructive }]}>
                Delete command
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
