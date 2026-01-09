import { useState } from "react";
import { Image, type ImageStyle, type StyleProp } from "react-native";
import { useTheme } from "@/theme";

interface ProviderLogoProps {
  providerId: string;
  size?: number;
  style?: StyleProp<ImageStyle>;
}

/**
 * Provider logo component that loads logos from models.dev
 * Matches desktop ProviderLogo.tsx functionality
 */
export function ProviderLogo({ providerId, size = 16, style }: ProviderLogoProps) {
  const { isDark } = useTheme();
  const [hasError, setHasError] = useState(false);

  if (hasError || !providerId) {
    return null;
  }

  const normalizedId = providerId.toLowerCase();
  const logoUrl = `https://models.dev/logos/${normalizedId}.svg`;

  return (
    <Image
      source={{ uri: logoUrl }}
      style={[
        {
          width: size,
          height: size,
          // Invert in dark mode to match desktop behavior
          tintColor: isDark ? "#ffffff" : undefined,
        },
        style,
      ]}
      resizeMode="contain"
      onError={() => setHasError(true)}
    />
  );
}
