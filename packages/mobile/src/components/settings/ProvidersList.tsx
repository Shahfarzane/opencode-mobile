import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { type Provider, providersApi } from "@/api";
import { typography, useTheme } from "@/theme";
import { listStyles } from "./list.styles";
import { SettingsListItem } from "./SettingsListItem";

interface ProvidersListProps {
  selectedProvider?: string | null;
  onSelectProvider: (providerId: string) => void;
}

export function ProvidersList({
  selectedProvider,
  onSelectProvider,
}: ProvidersListProps) {
  const { colors } = useTheme();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadProviders = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setIsRefreshing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      setIsLoading(true);
    }
    try {
      // Use listConnected() to get only authenticated providers
      const data = await providersApi.listConnected();
      setProviders(data);
    } catch (error) {
      console.error("Failed to load providers:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProviders(false);
  }, [loadProviders]);

  const handleRefresh = useCallback(() => {
    loadProviders(true);
  }, [loadProviders]);

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
        className={listStyles.headerSimple({})}
        style={{ borderBottomColor: colors.border }}
      >
        <Text style={[typography.meta, { color: colors.mutedForeground }]}>
          Total {providers.length}
        </Text>
      </View>

      <View className={listStyles.section({})}>
        {providers.map((provider) => (
          <SettingsListItem
            key={provider.id}
            title={provider.name || provider.id}
            subtitle={`${provider.models?.length || 0} models`}
            badge={provider.enabled ? "Enabled" : undefined}
            
            onPress={() => onSelectProvider(provider.id)}
          />
        ))}
      </View>

      {providers.length === 0 && (
        <View className={listStyles.emptyContainer({})}>
          <Text style={[typography.uiLabel, { color: colors.mutedForeground }]}>
            No providers connected
          </Text>
          <Text
            style={[
              typography.meta,
              { color: colors.mutedForeground, textAlign: "center" },
            ]}
          >
            Configure API keys in your OpenCode settings to connect providers
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
