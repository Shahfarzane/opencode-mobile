import { View, Text, Pressable, ScrollView } from "react-native";
import { useState, useCallback } from "react";
import { useColorScheme } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { FlexokiDark, FlexokiLight } from "@/theme/colors";

type CodeBlockProps = {
  code: string;
  language: string;
};

const LANGUAGE_COLORS: Record<string, string> = {
  typescript: "#3178C6",
  javascript: "#F7DF1E",
  python: "#3776AB",
  rust: "#DEA584",
  go: "#00ADD8",
  ruby: "#CC342D",
  java: "#B07219",
  swift: "#F05138",
  kotlin: "#A97BFF",
  css: "#1572B6",
  html: "#E34F26",
  json: "#292929",
  yaml: "#CB171E",
  bash: "#4EAA25",
  shell: "#4EAA25",
  sql: "#336791",
  graphql: "#E10098",
  markdown: "#083FA1",
  tsx: "#3178C6",
  jsx: "#61DAFB",
};

export function CodeBlock({ code, language }: CodeBlockProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? FlexokiDark : FlexokiLight;
  const [copied, setCopied] = useState(false);

  const languageColor = LANGUAGE_COLORS[language.toLowerCase()] || colors.mutedForeground;

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(code);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const trimmedCode = code.replace(/\n$/, "");
  const lines = trimmedCode.split("\n");

  return (
    <View className="my-2 overflow-hidden rounded-lg border border-border">
      <View
        className="flex-row items-center justify-between px-3 py-2"
        style={{ backgroundColor: colors.muted }}
      >
        <View className="flex-row items-center gap-2">
          <View
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: languageColor }}
          />
          <Text className="font-mono text-xs text-muted-foreground">
            {language || "text"}
          </Text>
        </View>
        <Pressable
          onPress={handleCopy}
          className="rounded px-2 py-1 active:bg-accent"
        >
          <Text className="font-mono text-xs text-muted-foreground">
            {copied ? "Copied!" : "Copy"}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ backgroundColor: colors.card }}
      >
        <View className="flex-row p-3">
          <View className="mr-3 items-end">
            {lines.map((line, lineNum) => (
              <Text
                key={`num-${lineNum}-${line.length}`}
                className="font-mono text-xs leading-5 text-muted-foreground"
                style={{ opacity: 0.5 }}
              >
                {lineNum + 1}
              </Text>
            ))}
          </View>
          <View>
            {lines.map((line, lineNum) => (
              <Text
                key={`line-${lineNum}-${line.slice(0, 10)}`}
                className="font-mono text-xs leading-5 text-foreground"
              >
                {line || " "}
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
