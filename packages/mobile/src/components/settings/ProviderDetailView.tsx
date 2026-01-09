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
import { type Provider, providersApi } from "@/api";
import { ChevronLeft } from "@/components/icons";
import { Button } from "@/components/ui";
import { fontStyle, Spacing, typography, useTheme } from "@/theme";
import { withOpacity, OPACITY } from "@/utils/colors";
import { providerDetailViewStyles } from "./ProviderDetailView.styles";

interface ProviderDetailViewProps {
  providerId: string;
  onBack: () => void;
}

export function ProviderDetailView({
  providerId,
  onBack,
}: ProviderDetailViewProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [apiKey, setApiKey] = useState("");

  const loadProvider = useCallback(async () => {
    setIsLoading(true);
    try {
      const providersList = await providersApi.list();
      const foundProvider = providersList.find((p) => p.id === providerId);
      if (foundProvider) {
        setProvider(foundProvider);
      }
    } catch (error) {
      console.error("Failed to load provider:", error);
      Alert.alert("Error", "Failed to load provider details");
    } finally {
      setIsLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    loadProvider();
  }, [loadProvider]);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      Alert.alert("Error", "API key is required");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSaving(true);
    try {
      const success = await providersApi.setApiKey(providerId, apiKey.trim());
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Success", "API key saved");
        setApiKey("");
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Error", "Failed to save API key");
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to save API key"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View className={providerDetailViewStyles.centered({})}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!provider) {
    return (
      <View className={providerDetailViewStyles.container({})}>
        <View
          className={providerDetailViewStyles.header({})}
          style={{ paddingTop: insets.top + Spacing.sm }}
        >
          <Pressable
            onPress={onBack}
            className={providerDetailViewStyles.backButton({})}
            hitSlop={8}
          >
            <ChevronLeft size={18} color={colors.foreground} />
            <Text style={[typography.uiLabel, { color: colors.foreground }]}>
              Provider
            </Text>
          </Pressable>
        </View>
        <View className={providerDetailViewStyles.centered({})}>
          <Text style={[typography.meta, { color: colors.mutedForeground }]}>
            Provider not found
          </Text>
        </View>
      </View>
    );
  }

  const modelCount = provider.models?.length ?? 0;

  return (
    <View className={providerDetailViewStyles.container({})}>
      {/* Header */}
      <View
        className={providerDetailViewStyles.header({})}
        style={{ paddingTop: insets.top + Spacing.sm }}
      >
        <Pressable
          onPress={onBack}
          className={providerDetailViewStyles.backButton({})}
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
            {provider.name || provider.id}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        className={providerDetailViewStyles.scroll({})}
        contentContainerClassName={providerDetailViewStyles.content({})}
        showsVerticalScrollIndicator={false}
      >
        {/* Provider ID */}
        <Text style={[typography.meta, { color: colors.mutedForeground }]}>
          Provider ID: {provider.id}
        </Text>

        {/* API Key Section */}
        <View className={providerDetailViewStyles.section({})}>
          <Text
            className={providerDetailViewStyles.sectionTitle({})}
            style={[
              typography.uiLabel,
              fontStyle("600"),
              { color: colors.foreground },
            ]}
          >
            API key
          </Text>
          <View className={providerDetailViewStyles.inputRow({})}>
            <TextInput
              className={providerDetailViewStyles.input({})}
              style={[
                typography.uiLabel,
                {
                  color: colors.foreground,
                  borderColor: colors.border,
                },
              ]}
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="sk-..."
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Button
              variant={apiKey.trim() ? "primary" : "muted"}
              size="sm"
              onPress={handleSaveApiKey}
              isDisabled={isSaving || !apiKey.trim()}
              isLoading={isSaving}
            >
              <Button.Label>Save</Button.Label>
            </Button>
          </View>
          <Text
            className="mt-1.5"
            style={[typography.micro, { color: colors.mutedForeground }]}
          >
            Keys are sent directly to the server and never stored locally.
          </Text>
        </View>

        {/* Models Section */}
        {modelCount > 0 && (
          <View
            className={providerDetailViewStyles.section({})}
            style={{ borderTopColor: withOpacity(colors.border, OPACITY.scrim) }}
          >
            <Text
              className={providerDetailViewStyles.sectionTitle({})}
              style={[
                typography.uiLabel,
                fontStyle("600"),
                { color: colors.foreground },
              ]}
            >
              Models
            </Text>
            <Text
              className="mb-3"
              style={[typography.meta, { color: colors.mutedForeground }]}
            >
              {modelCount} model{modelCount !== 1 ? "s" : ""} available
            </Text>
            <View
              className={providerDetailViewStyles.modelList({})}
              style={{ borderColor: withOpacity(colors.border, OPACITY.scrim) }}
            >
              {provider.models?.map((model, index) => (
                <View
                  key={model.id}
                  className={providerDetailViewStyles.modelItem({
                    hasTopBorder: index > 0,
                  })}
                  style={index > 0 ? { borderTopColor: withOpacity(colors.border, OPACITY.scrim) } : undefined}
                >
                  <Text
                    style={[
                      typography.meta,
                      fontStyle("500"),
                      { color: colors.foreground },
                    ]}
                    numberOfLines={1}
                  >
                    {model.name || model.id}
                  </Text>
                  {model.contextLength && (
                    <Text
                      style={[typography.micro, { color: colors.mutedForeground }]}
                    >
                      {(model.contextLength / 1000).toFixed(0)}k ctx
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
