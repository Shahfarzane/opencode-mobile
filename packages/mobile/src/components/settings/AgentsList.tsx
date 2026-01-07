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
import { type Agent, agentsApi, isAgentBuiltIn, isAgentHidden } from "@/api";
import { PlusIcon } from "@/components/icons";
import { fontStyle, typography, useTheme } from "@/theme";
import { listStyles } from "./list.styles";
import { SettingsListItem } from "./SettingsListItem";

export interface AgentsListRef {
  refresh: () => Promise<void>;
}

interface AgentsListProps {
  selectedAgent?: string | null;
  onSelectAgent: (agentName: string) => void;
}

export const AgentsList = forwardRef<AgentsListRef, AgentsListProps>(
  function AgentsList({ selectedAgent, onSelectAgent }, ref) {
    const { colors } = useTheme();
    const [agents, setAgents] = useState<Agent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadAgents = useCallback(async (showRefresh = false) => {
      if (showRefresh) {
        setIsRefreshing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        setIsLoading(true);
      }
      try {
        const data = await agentsApi.list();
        setAgents(data.filter((a) => !isAgentHidden(a)));
      } catch (error) {
        console.error("Failed to load agents:", error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        refresh: () => loadAgents(false),
      }),
      [loadAgents]
    );

    useEffect(() => {
      loadAgents(false);
    }, [loadAgents]);

    const handleRefresh = useCallback(() => {
      loadAgents(true);
    }, [loadAgents]);

    const builtInAgents = agents.filter(isAgentBuiltIn);
    const customAgents = agents.filter((a) => !isAgentBuiltIn(a));

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
            Total {agents.length}
          </Text>
          <Pressable
            onPress={() => onSelectAgent("__new__")}
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

        {builtInAgents.length > 0 && (
          <View className={listStyles.section({})}>
            <Text
              className={listStyles.sectionTitle({})}
              style={[
                typography.micro,
                fontStyle("600"),
                { color: colors.mutedForeground },
              ]}
            >
              BUILT-IN AGENTS
            </Text>
            {builtInAgents.map((agent) => (
              <SettingsListItem
                key={agent.name}
                title={agent.name}
                subtitle={agent.description}
                badge={agent.mode}
                
                onPress={() => onSelectAgent(agent.name)}
              />
            ))}
          </View>
        )}

        {customAgents.length > 0 && (
          <View className={listStyles.section({})}>
            <Text
              className={listStyles.sectionTitle({})}
              style={[
                typography.micro,
                fontStyle("600"),
                { color: colors.mutedForeground },
              ]}
            >
              CUSTOM AGENTS
            </Text>
            {customAgents.map((agent) => (
              <SettingsListItem
                key={agent.name}
                title={agent.name}
                subtitle={agent.description}
                badge={agent.mode}
                
                onPress={() => onSelectAgent(agent.name)}
              />
            ))}
          </View>
        )}

        {agents.length === 0 && (
          <View className={listStyles.emptyContainer({})}>
            <Text
              style={[typography.uiLabel, { color: colors.mutedForeground }]}
            >
              No agents yet
            </Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelectAgent("__new__");
              }}
              className={listStyles.createButton({})}
              style={{ backgroundColor: colors.primary }}
            >
              <PlusIcon size={16} color={colors.background} />
              <Text style={[typography.uiLabel, { color: colors.background }]}>
                Create your first agent
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    );
  }
);
