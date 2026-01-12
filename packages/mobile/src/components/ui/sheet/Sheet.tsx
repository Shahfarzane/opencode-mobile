import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetView,
  type BottomSheetBackdropProps,
  type BottomSheetModalProps,
  type BottomSheetProps,
  useBottomSheetSpringConfigs,
} from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import { forwardRef, useCallback, useMemo } from "react";
import type { ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimationTokens, useTheme } from "@/theme";
import { OPACITY, withOpacity } from "@/utils/colors";

interface SheetProps extends Omit<BottomSheetProps, "snapPoints" | "onChange"> {
  snapPoints?: Array<string | number>;
  backdropOpacity?: number;
  onClose?: () => void;
  contentPadding?: number;
  onChange?: (index: number) => void;
  enableContentPanningGesture?: boolean;
  enableHandlePanningGesture?: boolean;
}

export const Sheet = forwardRef<BottomSheet, SheetProps>(
  (
    {
      snapPoints = ["64%", "92%"],
      backdropOpacity = 0.4,
      onClose,
      onChange,
      enablePanDownToClose = true,
      enableContentPanningGesture = true,
      enableHandlePanningGesture = true,
      contentPadding = 16,
      children,
      backgroundStyle,
      handleIndicatorStyle,
      style,
      ...props
    },
    ref,
  ) => {
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();

    const renderBackdrop = useCallback(
      (backdropProps: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...backdropProps}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          pressBehavior="close"
          opacity={backdropOpacity}
        />
      ),
      [backdropOpacity],
    );

    const handleChange = useCallback(
    		(index: number) => {
    			if (index === 0) {
    				Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    			}
    			if (index === -1) {
    				Haptics.selectionAsync().catch(() => {});
    				onClose?.();
    			}
    			onChange?.(index);
    		},
    		[onChange, onClose],
    	);

    const animationConfigs = useBottomSheetSpringConfigs({
      ...AnimationTokens.sheetSpring,
      overshootClamping: true,
    });

    const paddingBottom = useMemo(
      () => Math.max(contentPadding * 1.25, insets.bottom + contentPadding / 2),
      [contentPadding, insets.bottom],
    );

    const baseBackground: ViewStyle = useMemo(
      () => ({
        backgroundColor: colors.card,
        borderColor: withOpacity(colors.border, OPACITY.border),
        borderWidth: 1,
        borderRadius: 26,
        overflow: "hidden",
      }),
      [colors.card, colors.border],
    );

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={enablePanDownToClose}
        enableContentPanningGesture={enableContentPanningGesture}
        enableHandlePanningGesture={enableHandlePanningGesture}
        backdropComponent={renderBackdrop}
        onChange={handleChange}
        bottomInset={insets.bottom + 8}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        animationConfigs={animationConfigs}
        backgroundStyle={[baseBackground, backgroundStyle]}
        handleIndicatorStyle={[
          {
            backgroundColor: withOpacity(colors.mutedForeground, 0.9),
            width: 48,
            height: 5,
            borderRadius: 999,
          },
          handleIndicatorStyle,
        ]}
        style={[{ zIndex: 9999, elevation: 9999 }, style]}
        {...props}
      >
        <BottomSheetView
          style={{
            flex: 1,
            paddingHorizontal: contentPadding,
            paddingBottom,
          }}
        >
          {children}
        </BottomSheetView>
      </BottomSheet>
    );
  },
);

Sheet.displayName = "Sheet";

export const SheetScrollView = BottomSheetScrollView;
export const SheetTextInput = BottomSheetTextInput;
export const SheetView = BottomSheetView;
