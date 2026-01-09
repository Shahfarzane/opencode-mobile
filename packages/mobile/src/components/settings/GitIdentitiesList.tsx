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
import { type GitIdentityProfile, gitApi } from "@/api";
import { PlusIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { typography, useTheme } from "@/theme";
import { listStyles } from "./list.styles";
import { SettingsListItem } from "./SettingsListItem";

export interface GitIdentitiesListRef {
  refresh: () => Promise<void>;
}

interface GitIdentitiesListProps {
  selectedProfile?: string | null;
  onSelectProfile: (profileId: string) => void;
}

export const GitIdentitiesList = forwardRef<
  GitIdentitiesListRef,
  GitIdentitiesListProps
>(function GitIdentitiesList({ selectedProfile, onSelectProfile }, ref) {
  const { colors } = useTheme();
  const [profiles, setProfiles] = useState<GitIdentityProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadProfiles = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setIsRefreshing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      setIsLoading(true);
    }
    try {
      const data = await gitApi.getIdentities();
      setProfiles(data);
    } catch (error) {
      console.error("Failed to load git identities:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      refresh: () => loadProfiles(false),
    }),
    [loadProfiles]
  );

  useEffect(() => {
    loadProfiles(false);
  }, [loadProfiles]);

  const handleRefresh = useCallback(() => {
    loadProfiles(true);
  }, [loadProfiles]);

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
          Total {profiles.length}
        </Text>
        <Button
          variant="primary"
          size="xs"
          onPress={() => onSelectProfile("__new__")}
        >
          <PlusIcon size={14} color={colors.primaryForeground} />
          <Button.Label>Add</Button.Label>
        </Button>
      </View>

      <View className={listStyles.section({})}>
        {profiles.map((profile) => (
          <SettingsListItem
            key={profile.id}
            title={profile.name}
            subtitle={profile.userEmail}
            
            onPress={() => onSelectProfile(profile.id)}
          />
        ))}
      </View>

      {profiles.length === 0 && (
        <View className={listStyles.emptyContainer({})}>
          <Text style={[typography.uiLabel, { color: colors.mutedForeground }]}>
            No git identities yet
          </Text>
          <Button
            variant="primary"
            size="sm"
            onPress={() => onSelectProfile("__new__")}
          >
            <PlusIcon size={16} color={colors.primaryForeground} />
            <Button.Label>Create your first identity</Button.Label>
          </Button>
        </View>
      )}
    </ScrollView>
  );
});
