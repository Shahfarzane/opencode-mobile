import { useCallback, useState, useEffect } from "react";
import { View, type ViewStyle, type StyleProp } from "react-native";
import { SvgUri } from "react-native-svg";
import { useTheme } from "@/theme";

interface ProviderLogoProps {
  providerId: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Provider logo component that loads SVG logos from models.dev
 * Uses SvgUri from react-native-svg for proper SVG support
 */
export function ProviderLogo({ providerId, size = 16, style, onLoad, onError }: ProviderLogoProps) {
  const { isDark } = useTheme();
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Reset state when providerId changes
  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [providerId]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  if (hasError || !providerId) {
    return null;
  }

  const normalizedId = providerId.toLowerCase();
  const logoUrl = `https://models.dev/logos/${normalizedId}.svg`;

  return (
    <View style={[{ width: size, height: size }, style]}>
      <SvgUri
        uri={logoUrl}
        width={size}
        height={size}
        fill={isDark ? "#ffffff" : "#000000"}
        onLoad={handleLoad}
        onError={handleError}
      />
    </View>
  );
}
