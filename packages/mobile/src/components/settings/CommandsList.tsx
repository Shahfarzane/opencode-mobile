import * as Haptics from "expo-haptics";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { type Command, commandsApi, isCommandBuiltIn } from "@/api";
import { PlusIcon } from "@/components/icons";
import { fontStyle, typography, useTheme } from "@/theme";
import { listStyles } from "./list.styles";
import { SettingsListItem } from "./SettingsListItem";

export interface CommandsListRef {
  refresh: () => Promise<void>;
}

interface CommandsListProps {
  selectedCommand?: string | null;
  onSelectCommand: (commandName: string) => void;
}

export const CommandsList = forwardRef<CommandsListRef, CommandsListProps>(
  function CommandsList({ selectedCommand, onSelectCommand }, ref) {
    const { colors } = useTheme();
    const [commands, setCommands] = useState<Command[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadCommands = useCallback(async (showRefresh = false) => {
      if (showRefresh) {
        setIsRefreshing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        setIsLoading(true);
      }
      try {
        const data = await commandsApi.list();
        setCommands(data.filter((c) => !c.hidden));
      } catch (error) {
        console.error("Failed to load commands:", error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        refresh: () => loadCommands(false),
      }),
      [loadCommands]
    );

    useEffect(() => {
      loadCommands(false);
    }, [loadCommands]);

    const handleRefresh = useCallback(() => {
      loadCommands(true);
    }, [loadCommands]);

    const builtInCommands = commands.filter(isCommandBuiltIn);
    const customCommands = commands.filter((c) => !isCommandBuiltIn(c));

    if (isLoading) {
      return (
        <View className={listStyles.loadingContainer({})}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    return (
      <ScrollView
        className={listStyles.container({})}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View
          className={listStyles.header({})}
          style={{ borderBottomColor: colors.border }}
        >
          <Text style={[typography.meta, { color: colors.mutedForeground }]}>
            Total {commands.length}
          </Text>
          <Pressable
            onPress={() => onSelectCommand("__new__")}
            className={listStyles.addButton({})}
            style={{ backgroundColor: colors.primary }}
          >
            <PlusIcon size={14} color={colors.background} />
            <Text
              style={[
                typography.micro,
                fontStyle("600"),
                { color: colors.background },
              ]}
            >
              Add
            </Text>
          </Pressable>
        </View>

        {builtInCommands.length > 0 && (
          <View className={listStyles.section({})}>
            <Text
              className={listStyles.sectionTitle({})}
              style={[
                typography.micro,
                fontStyle("600"),
                { color: colors.mutedForeground },
              ]}
            >
              BUILT-IN COMMANDS
            </Text>
            {builtInCommands.map((command) => (
              <SettingsListItem
                key={command.name}
                title={`/${command.name}`}
                subtitle={command.description}
                
                onPress={() => onSelectCommand(command.name)}
              />
            ))}
          </View>
        )}

        {customCommands.length > 0 && (
          <View className={listStyles.section({})}>
            <Text
              className={listStyles.sectionTitle({})}
              style={[
                typography.micro,
                fontStyle("600"),
                { color: colors.mutedForeground },
              ]}
            >
              CUSTOM COMMANDS
            </Text>
            {customCommands.map((command) => (
              <SettingsListItem
                key={command.name}
                title={`/${command.name}`}
                subtitle={command.description}
                
                onPress={() => onSelectCommand(command.name)}
              />
            ))}
          </View>
        )}

        {commands.length === 0 && (
          <View className={listStyles.emptyContainer({})}>
            <Text
              style={[typography.uiLabel, { color: colors.mutedForeground }]}
            >
              No custom commands yet
            </Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelectCommand("__new__");
              }}
              className={listStyles.createButton({})}
              style={{ backgroundColor: colors.primary }}
            >
              <PlusIcon size={16} color={colors.background} />
              <Text style={[typography.uiLabel, { color: colors.background }]}>
                Create your first command
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    );
  }
);
