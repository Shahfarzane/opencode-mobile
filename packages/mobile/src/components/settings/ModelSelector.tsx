import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { type Provider } from "@/api";
import { CheckIcon, ChevronDownIcon, ChevronRightIcon, XIcon } from "@/components/icons";
import { fontStyle, typography, useTheme } from "@/theme";
import { withOpacity, OPACITY } from "@/utils/colors";

interface ModelSelectorProps {
  providers: Provider[];
  providerId: string;
  modelId: string;
  onChange: (providerId: string, modelId: string) => void;
  disabled?: boolean;
}

export function ModelSelector({
  providers,
  providerId,
  modelId,
  onChange,
  disabled = false,
}: ModelSelectorProps) {
  const { colors } = useTheme();
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(
    // Auto-expand the selected provider
    providerId ? new Set([providerId]) : new Set()
  );

  const toggleProvider = (provId: string) => {
    setExpandedProviders((prev) => {
      const next = new Set(prev);
      if (next.has(provId)) {
        next.delete(provId);
      } else {
        next.add(provId);
      }
      return next;
    });
  };

  const handleSelectModel = (provId: string, modId: string) => {
    if (!disabled) {
      onChange(provId, modId);
    }
  };

  const handleClearSelection = () => {
    if (!disabled) {
      onChange("", "");
    }
  };

  const selectedDisplay = providerId && modelId
    ? `${providerId}/${modelId}`
    : null;

  return (
    <View
      className="border rounded-lg overflow-hidden"
      style={{ borderColor: colors.border }}
    >
      {/* Selected display / Clear option */}
      {selectedDisplay && (
        <Pressable
          onPress={handleClearSelection}
          disabled={disabled}
          className="flex-row items-center justify-between px-3 py-2.5 border-b"
          style={[
            { borderBottomColor: withOpacity(colors.border, OPACITY.scrim) },
            { backgroundColor: withOpacity(colors.primary, OPACITY.active) },
          ]}
        >
          <View className="flex-row items-center gap-2 flex-1">
            <CheckIcon size={14} color={colors.primary} />
            <Text
              style={[typography.meta, fontStyle("600"), { color: colors.primary }]}
              numberOfLines={1}
            >
              {selectedDisplay}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Text style={[typography.micro, { color: colors.mutedForeground }]}>
              Tap to clear
            </Text>
            <XIcon size={14} color={colors.mutedForeground} />
          </View>
        </Pressable>
      )}

      {/* No selection option */}
      {!selectedDisplay && (
        <View
          className="px-3 py-2.5 border-b"
          style={[
            { borderBottomColor: withOpacity(colors.border, OPACITY.scrim) },
            { backgroundColor: withOpacity(colors.primary, OPACITY.active) },
          ]}
        >
          <Text style={[typography.meta, { color: colors.primary }]}>
            No model selected (optional)
          </Text>
        </View>
      )}

      {/* Provider list with models */}
      <ScrollView
        style={{ maxHeight: 300 }}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {providers.map((provider, provIndex) => {
          const isExpanded = expandedProviders.has(provider.id);
          const providerModels = provider.models || [];
          const hasModels = providerModels.length > 0;
          const isSelectedProvider = provider.id === providerId;

          if (!hasModels) return null;

          return (
            <View key={provider.id}>
              {/* Provider header */}
              <Pressable
                onPress={() => toggleProvider(provider.id)}
                className="flex-row items-center justify-between px-3 py-2.5"
                style={[
                  provIndex > 0 && {
                    borderTopWidth: 1,
                    borderTopColor: withOpacity(colors.border, OPACITY.scrim),
                  },
                  isSelectedProvider && !isExpanded && {
                    backgroundColor: withOpacity(colors.primary, OPACITY.hover),
                  },
                ]}
              >
                <View className="flex-row items-center gap-2">
                  {isExpanded ? (
                    <ChevronDownIcon size={14} color={colors.mutedForeground} />
                  ) : (
                    <ChevronRightIcon size={14} color={colors.mutedForeground} />
                  )}
                  <Text
                    style={[
                      typography.meta,
                      fontStyle("600"),
                      { color: isSelectedProvider ? colors.primary : colors.foreground },
                    ]}
                  >
                    {provider.name}
                  </Text>
                  {isSelectedProvider && (
                    <Text style={[typography.micro, { color: colors.primary }]}>
                      (selected)
                    </Text>
                  )}
                </View>
                <Text style={[typography.micro, { color: colors.mutedForeground }]}>
                  {providerModels.length} models
                </Text>
              </Pressable>

              {/* Models list when expanded */}
              {isExpanded && (
                <View
                  style={{
                    backgroundColor: withOpacity(colors.muted, OPACITY.scrim),
                  }}
                >
                  {providerModels.map((model, modelIndex) => {
                    const isSelectedModel =
                      provider.id === providerId && model.id === modelId;

                    return (
                      <Pressable
                        key={model.id}
                        onPress={() => handleSelectModel(provider.id, model.id)}
                        disabled={disabled}
                        className="flex-row items-center justify-between px-3 py-2 pl-8"
                        style={[
                          modelIndex > 0 && {
                            borderTopWidth: 1,
                            borderTopColor: withOpacity(colors.border, OPACITY.scrim),
                          },
                          isSelectedModel && {
                            backgroundColor: withOpacity(colors.primary, OPACITY.active),
                          },
                        ]}
                      >
                        <Text
                          style={[
                            typography.meta,
                            {
                              color: isSelectedModel
                                ? colors.primary
                                : colors.foreground,
                            },
                            isSelectedModel && fontStyle("500"),
                          ]}
                          numberOfLines={1}
                          className="flex-1"
                        >
                          {model.name || model.id}
                        </Text>
                        {isSelectedModel && (
                          <CheckIcon size={14} color={colors.primary} />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}

        {providers.length === 0 && (
          <View className="px-3 py-4">
            <Text
              style={[typography.meta, { color: colors.mutedForeground }]}
              className="text-center"
            >
              No providers available
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
