import React from 'react';
import { View, Pressable, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';

type MainTab = 'chat' | 'diff' | 'terminal' | 'git';

interface TabConfig {
  id: MainTab;
  label: string;
}

const tabs: TabConfig[] = [
  { id: 'chat', label: 'Chat' },
  { id: 'diff', label: 'Diff' },
  { id: 'terminal', label: 'Terminal' },
  { id: 'git', label: 'Git' },
];

interface HeaderProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  onMenuPress: () => void;
  onSettingsPress: () => void;
  hasUpdate?: boolean;
}

function MenuIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 12h18M3 6h18M3 18h18"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChatIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CodeIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="m16 18 6-6-6-6M8 6l-6 6 6 6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TerminalIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="m4 17 6-6-6-6M12 19h8"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function GitIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="18" r="3" stroke={color} strokeWidth={2} />
      <Circle cx="6" cy="6" r="3" stroke={color} strokeWidth={2} />
      <Circle cx="18" cy="6" r="3" stroke={color} strokeWidth={2} />
      <Path
        d="M18 9v2a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9"
        stroke={color}
        strokeWidth={2}
      />
      <Path d="M12 13v2" stroke={color} strokeWidth={2} />
    </Svg>
  );
}

function SettingsIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={2} />
    </Svg>
  );
}

function getTabIcon(tabId: MainTab, color: string, size: number) {
  switch (tabId) {
    case 'chat':
      return <ChatIcon color={color} size={size} />;
    case 'diff':
      return <CodeIcon color={color} size={size} />;
    case 'terminal':
      return <TerminalIcon color={color} size={size} />;
    case 'git':
      return <GitIcon color={color} size={size} />;
  }
}

export function Header({
  activeTab,
  onTabChange,
  onMenuPress,
  onSettingsPress,
  hasUpdate = false,
}: HeaderProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const colors = {
    background: isDark ? '#100F0F' : '#FFFCF0',
    border: isDark ? '#343331' : '#DAD8CE',
    inactive: isDark ? '#878580' : '#6F6E69',
    active: isDark ? '#CECDC3' : '#100F0F',
    primary: '#EC8B49',
  };

  return (
    <View
      style={{
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingTop: insets.top,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 12,
          height: 52,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable
            onPress={onMenuPress}
            style={{
              padding: 8,
              marginLeft: -8,
            }}
            hitSlop={8}
          >
            <MenuIcon color={colors.inactive} size={20} />
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => onTabChange(tab.id)}
                style={{
                  padding: 10,
                }}
                hitSlop={4}
              >
                {getTabIcon(
                  tab.id,
                  isActive ? colors.active : colors.inactive,
                  20
                )}
              </Pressable>
            );
          })}

          <Pressable
            onPress={onSettingsPress}
            style={{
              padding: 10,
              position: 'relative',
            }}
            hitSlop={4}
          >
            <SettingsIcon color={colors.inactive} size={20} />
            {hasUpdate && (
              <View
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: colors.primary,
                }}
              />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default Header;
