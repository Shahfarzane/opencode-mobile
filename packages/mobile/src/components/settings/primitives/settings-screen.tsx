import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, XIcon } from "@/components/icons";
import { Spacing, useTheme, Fonts, FontSizes } from "@/theme";
import { settingsScreenStyles } from "./settings-screen.styles";
import type { SettingsScreenProps } from "./settings-screen.types";

const DISPLAY_NAME = "SettingsScreen";

/**
 * Reusable settings screen wrapper with header.
 * Provides consistent navigation and styling.
 *
 * @example
 * <SettingsScreen title="Settings">
 *   <SettingsSection title="General">
 *     <SettingsRow title="Theme" />
 *   </SettingsSection>
 * </SettingsScreen>
 */
export function SettingsScreen({
  title,
  showClose = false,
  onBack,
  children,
  scrollable = true,
  className,
  style,
}: SettingsScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const containerClassName = settingsScreenStyles.container({ className });
  const headerClassName = settingsScreenStyles.header({});
  const headerButtonClassName = settingsScreenStyles.headerButton({});
  const titleClassName = settingsScreenStyles.title({});
  const scrollViewClassName = settingsScreenStyles.scrollView({});
  const scrollContentClassName = settingsScreenStyles.scrollContent({});
  const contentClassName = settingsScreenStyles.content({});

  const content = scrollable ? (
    <ScrollView
      className={scrollViewClassName}
      contentContainerStyle={{ paddingBottom: insets.bottom + Spacing[4] }}
      showsVerticalScrollIndicator={false}
    >
      <View className={scrollContentClassName}>{children}</View>
    </ScrollView>
  ) : (
    <View
      className={contentClassName}
      style={{ paddingBottom: insets.bottom }}
    >
      {children}
    </View>
  );

  return (
    <View
      className={containerClassName}
      style={[{ backgroundColor: colors.background }, style]}
    >
      <View
        className={headerClassName}
        style={{
          paddingTop: insets.top + Spacing[2],
          borderBottomColor: colors.border,
        }}
      >
        <Pressable
          onPress={handleBack}
          className={headerButtonClassName}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {showClose ? (
            <XIcon size={20} color={colors.mutedForeground} />
          ) : (
            <ChevronLeft size={24} color={colors.foreground} />
          )}
        </Pressable>
        <Text
          className={titleClassName}
          style={{
            color: colors.foreground,
            fontSize: FontSizes.uiHeader,
            fontFamily: Fonts.semiBold,
          }}
        >
          {title}
        </Text>
        <View className={headerButtonClassName} />
      </View>
      {content}
    </View>
  );
}

SettingsScreen.displayName = DISPLAY_NAME;

export type { SettingsScreenProps };
