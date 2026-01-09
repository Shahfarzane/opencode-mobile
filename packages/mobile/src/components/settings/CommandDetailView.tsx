import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  type Agent,
  agentsApi,
  type Command,
  type CommandConfig,
  commandsApi,
  isCommandBuiltIn,
} from "@/api";
import { ChevronLeft } from "@/components/icons";
import { fontStyle, typography, useTheme } from "@/theme";
import { withOpacity, OPACITY } from "@/utils/colors";
import { commandDetailViewStyles } from "./CommandDetailView.styles";

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
  const [command, setCommand] = useState<Command | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [template, setTemplate] = useState("");
  const [agentName, setAgentName] = useState("");
  const [subtask, setSubtask] = useState(false);

  const isBuiltIn = command ? isCommandBuiltIn(command) : false;
  const isNewCommand = commandName === "__new__";

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [commandsList, agentsList] = await Promise.all([
        commandsApi.list(),
        agentsApi.list(),
      ]);

      setAgents(agentsList.filter((a) => !a.hidden));

      if (!isNewCommand) {
        const foundCommand = commandsList.find((c) => c.name === commandName);
        if (foundCommand) {
          setCommand(foundCommand);
          setName(foundCommand.name);
          setDescription(foundCommand.description ?? "");
          setTemplate(foundCommand.template ?? "");
          setAgentName(foundCommand.agent ?? "");
          setSubtask(foundCommand.subtask ?? false);
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
        subtask: subtask || undefined,
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
      <View className={commandDetailViewStyles.centered({})}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View className={commandDetailViewStyles.container({})}>
      {/* Header */}
      <View className={commandDetailViewStyles.header({})}>
        <Pressable
          onPress={onBack}
          className={commandDetailViewStyles.backButton({})}
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
          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            className={commandDetailViewStyles.saveButton({ disabled: isSaving })}
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
        className={commandDetailViewStyles.scroll({})}
        contentContainerClassName={commandDetailViewStyles.content({})}
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

        {/* Name */}
        <View className={commandDetailViewStyles.field({})}>
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
            className={commandDetailViewStyles.input({})}
            style={[
              typography.uiLabel,
              { color: colors.foreground, borderColor: colors.border },
            ]}
            value={name}
            onChangeText={setName}
            placeholder="my-command"
            placeholderTextColor={colors.mutedForeground}
            editable={!isBuiltIn && isNewCommand}
          />
        </View>

        {/* Description */}
        <View className={commandDetailViewStyles.field({})}>
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
            className={commandDetailViewStyles.input({})}
            style={[
              typography.uiLabel,
              { color: colors.foreground, borderColor: colors.border },
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder="What this command does..."
            placeholderTextColor={colors.mutedForeground}
            editable={!isBuiltIn}
          />
        </View>

        {/* Template */}
        <View
          className={commandDetailViewStyles.section({})}
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
            Template
          </Text>
          <Text
            className="mb-2"
            style={[typography.micro, { color: colors.mutedForeground }]}
          >
            Use {"{{input}}"} for user input
          </Text>
          <TextInput
            className={commandDetailViewStyles.textarea({})}
            style={[
              typography.meta,
              { color: colors.foreground, borderColor: colors.border },
            ]}
            value={template}
            onChangeText={setTemplate}
            placeholder="Do something with {{input}}..."
            placeholderTextColor={colors.mutedForeground}
            editable={!isBuiltIn}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Agent */}
        <View
          className={commandDetailViewStyles.section({})}
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
            Agent
          </Text>
          <View
            className={commandDetailViewStyles.selectList({})}
            style={{ borderColor: withOpacity(colors.border, OPACITY.scrim) }}
          >
            <Pressable
              onPress={() => !isBuiltIn && setAgentName("")}
              className={commandDetailViewStyles.selectItem({})}
              style={!agentName ? { backgroundColor: withOpacity(colors.primary, OPACITY.active) } : undefined}
            >
              <Text
                style={[
                  typography.meta,
                  {
                    color: !agentName ? colors.primary : colors.mutedForeground,
                  },
                ]}
              >
                None
              </Text>
            </Pressable>
            {agents.map((agent) => (
              <Pressable
                key={agent.name}
                onPress={() => !isBuiltIn && setAgentName(agent.name)}
                className={commandDetailViewStyles.selectItem({ hasTopBorder: true })}
                style={[
                  { borderTopColor: withOpacity(colors.border, OPACITY.scrim) },
                  agentName === agent.name && {
                    backgroundColor: withOpacity(colors.primary, OPACITY.active),
                  },
                ]}
              >
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
              </Pressable>
            ))}
          </View>
        </View>

        {/* Subtask toggle */}
        <View
          className={commandDetailViewStyles.section({})}
          style={{ borderTopColor: withOpacity(colors.border, OPACITY.scrim) }}
        >
          <View className={commandDetailViewStyles.switchRow({})}>
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
            className={commandDetailViewStyles.section({})}
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
