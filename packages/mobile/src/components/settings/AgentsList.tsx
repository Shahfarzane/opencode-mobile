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
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { type Agent, agentsApi, isAgentBuiltIn, isAgentHidden } from "@/api";
import {
  AiAgentFillIcon,
  AiAgentIcon,
  LockIcon,
  PlusIcon,
  RobotIcon,
} from "@/components/icons";
import { Button } from "@/components/ui";
import { fontStyle, typography, useTheme } from "@/theme";
import { listStyles } from "./list.styles";
import { SettingsListItem } from "./SettingsListItem";

/**
 * Returns the appropriate mode icon for an agent based on its mode
 * Matches desktop AgentsSidebar.tsx:getAgentModeIcon
 */
function getAgentModeIcon(mode: string | undefined, primaryColor: string) {
  switch (mode) {
    case "primary":
      return <AiAgentIcon size={12} color={primaryColor} />;
    case "all":
      return <AiAgentFillIcon size={12} color={primaryColor} />;
    case "subagent":
      return <RobotIcon size={12} color={primaryColor} />;
    default:
      return null;
  }
}

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
          <Button
            variant="ghost"
            size="xs"
            onPress={() => onSelectAgent("__new__")}
          >
            <PlusIcon size={16} color={colors.mutedForeground} />
          </Button>
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
                badge="system"
                icon={<LockIcon size={12} color={colors.mutedForeground} />}
                modeIcon={getAgentModeIcon(agent.mode, colors.primary)}
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
                badge={(agent as { scope?: string }).scope}
                modeIcon={getAgentModeIcon(agent.mode, colors.primary)}
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
            <Button
              variant="secondary"
              size="sm"
              onPress={() => onSelectAgent("__new__")}
            >
              <PlusIcon size={16} color={colors.foreground} />
              <Button.Label>Create your first agent</Button.Label>
            </Button>
          </View>
        )}
      </ScrollView>
    );
  }
);
