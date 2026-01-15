import { FlashList } from "@shopify/flash-list";
import * as Haptics from "expo-haptics";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
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

type AgentListRow =
  | { type: "section"; title: string }
  | { type: "agent"; agent: Agent; isBuiltIn: boolean };

export const AgentsList = forwardRef<AgentsListRef, AgentsListProps>(
  function AgentsList({ selectedAgent: _selectedAgent, onSelectAgent }, ref) {
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

    const rows = useMemo<AgentListRow[]>(() => {
      const next: AgentListRow[] = [];

      if (builtInAgents.length > 0) {
        next.push({ type: "section", title: "BUILT-IN AGENTS" });
        for (const agent of builtInAgents) {
          next.push({ type: "agent", agent, isBuiltIn: true });
        }
      }

      if (customAgents.length > 0) {
        next.push({ type: "section", title: "CUSTOM AGENTS" });
        for (const agent of customAgents) {
          next.push({ type: "agent", agent, isBuiltIn: false });
        }
      }

      return next;
    }, [builtInAgents, customAgents]);

    if (isLoading) {
      return (
        <View className={listStyles.loadingContainer({})}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    return (
      <FlashList
        data={rows}
        renderItem={({ item }) => {
          if (item.type === "section") {
            return (
              <Text
                className={listStyles.sectionTitle({})}
                style={[
                  typography.micro,
                  fontStyle("600"),
                  { color: colors.mutedForeground },
                ]}
              >
                {item.title}
              </Text>
            );
          }

          const agent = item.agent;

          return (
            <SettingsListItem
              title={agent.name}
              subtitle={agent.description}
              badge={
                item.isBuiltIn
                  ? "system"
                  : (agent as { scope?: string }).scope
              }
              icon={
                item.isBuiltIn ? (
                  <LockIcon size={12} color={colors.mutedForeground} />
                ) : undefined
              }
              modeIcon={getAgentModeIcon(agent.mode, colors.primary)}
              onPress={() => onSelectAgent(agent.name)}
            />
          );
        }}
        keyExtractor={(item, index) =>
          item.type === "section" ? `section-${item.title}` : `agent-${item.agent.name}-${index}`
        }
        className={listStyles.container({})}
        ListHeaderComponent={
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
        }
        ListEmptyComponent={
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
        }
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        estimatedItemSize={64}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        updateCellsBatchingPeriod={50}
        windowSize={5}
      />
    );
  }
);
