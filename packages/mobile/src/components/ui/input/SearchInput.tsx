import * as Haptics from "expo-haptics";
import { forwardRef, useMemo } from "react";
import { Pressable, TextInput, View } from "react-native";
import { SearchIcon, XIcon } from "@/components/icons";
import { IconSizes, typography, useTheme } from "@/theme";
import { withOpacity } from "@/utils/colors";

interface SearchInputProps {
  /** Current search value */
  value: string;
  /** Callback when value changes */
  onChangeText: (text: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether to auto focus the input */
  autoFocus?: boolean;
  /** Additional className for the container */
  className?: string;
}

/**
 * SearchInput component
 *
 * A pre-styled search input with search icon and clear button.
 * Matches desktop PWA search input styling.
 *
 * @example
 * <SearchInput
 *   value={searchQuery}
 *   onChangeText={setSearchQuery}
 *   placeholder="Search files..."
 * />
 */
export const SearchInput = forwardRef<TextInput, SearchInputProps>(
  (
    {
      value,
      onChangeText,
      placeholder = "Search...",
      autoFocus = false,
      className,
    },
    ref
  ) => {
    const { colors } = useTheme();

    const containerStyle = useMemo(
      () => ({
        backgroundColor: withOpacity(colors.card, 0.86),
        borderColor: withOpacity(colors.border, 0.7),
        borderWidth: 1,
        shadowColor: withOpacity(colors.foreground, 0.06),
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.14,
        shadowRadius: 12,
        borderRadius: 18,
      }),
      [colors],
    );

    const handleClear = () => {
      Haptics.selectionAsync().catch(() => {});
      onChangeText("");
    };

    return (
      <View
        className={`flex-row items-center rounded-2xl px-3.5 py-3 gap-2 ${className ?? ""}`}
        style={containerStyle}
      >
        <SearchIcon size={IconSizes.md} color={colors.mutedForeground} />
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          className="flex-1 p-0"
          style={[typography.uiLabel, { color: colors.foreground }]}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus={autoFocus}
        />
        {value.length > 0 && (
          <Pressable
            onPress={handleClear}
            accessibilityLabel="Clear search"
            accessibilityRole="button"
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <XIcon size={IconSizes.md} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>
    );
  }
);

SearchInput.displayName = "SearchInput";
