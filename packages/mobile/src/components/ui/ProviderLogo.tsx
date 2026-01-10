import { useCallback, useState, useEffect } from "react";
import { View, Text, type ViewStyle, type StyleProp } from "react-native";
import { SvgUri } from "react-native-svg";
import { useTheme, typography, fontStyle } from "@/theme";

interface ProviderLogoProps {
  providerId: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Get a short symbol for a provider as fallback
 */
function getProviderSymbol(providerId: string): string {
  const id = providerId.toLowerCase();
  if (id.includes("anthropic")) return "A";
  if (id.includes("openai")) return "O";
  if (id.includes("google") || id.includes("gemini")) return "G";
  if (id.includes("mistral")) return "M";
  if (id.includes("groq")) return "Gr";
  if (id.includes("ollama")) return "Ol";
  if (id.includes("openrouter")) return "OR";
  if (id.includes("deepseek")) return "DS";
  if (id.includes("xai")) return "X";
  if (id.includes("cohere")) return "Co";
  if (id.includes("perplexity")) return "P";
  if (id.includes("nebius")) return "N";
  if (id.includes("github")) return "GH";
  if (id.includes("together")) return "T";
  if (id.includes("fireworks")) return "F";
  return providerId.charAt(0).toUpperCase();
}

/**
 * Provider logo component that loads SVG logos from models.dev
 * Uses SvgUri from react-native-svg for proper SVG support
 * Falls back to text symbol if logo fails to load
 */
export function ProviderLogo({ providerId, size = 16, style, onLoad, onError }: ProviderLogoProps) {
  const { colors } = useTheme();
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

  if (!providerId) {
    return null;
  }

  // Show fallback symbol if error
  if (hasError) {
    return (
      <View style={[{ width: size, height: size, alignItems: "center", justifyContent: "center" }, style]}>
        <Text style={[typography.micro, fontStyle("600"), { color: colors.foreground, fontSize: size * 0.6 }]}>
          {getProviderSymbol(providerId)}
        </Text>
      </View>
    );
  }

  const normalizedId = providerId.toLowerCase();
  const logoUrl = `https://models.dev/logos/${normalizedId}.svg`;
  const fillColor = colors.foreground;

  return (
    <View style={[{ width: size, height: size }, style]}>
      <SvgUri
        uri={logoUrl}
        width={size}
        height={size}
        fill={fillColor}
        color={fillColor}
        onLoad={handleLoad}
        onError={handleError}
      />
    </View>
  );
}
