import { forwardRef } from "react";
import { Pressable, TextInput, View } from "react-native";
import { SearchIcon, XIcon } from "@/components/icons";
import { typography, useTheme } from "@/theme";

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

    return (
      <View
        className={`flex-row items-center rounded-xl px-3 py-2.5 gap-2 ${className ?? ""}`}
        style={{ backgroundColor: colors.muted }}
      >
        <SearchIcon size={16} color={colors.mutedForeground} />
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
          <Pressable onPress={() => onChangeText("")} hitSlop={8}>
            <XIcon size={16} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>
    );
  }
);

SearchInput.displayName = "SearchInput";
