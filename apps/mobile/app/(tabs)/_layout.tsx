import { Pressable } from "react-native";
import { Link, Tabs } from "expo-router";
import { BarChart3, BookOpen, Home, MessageSquare, Settings, Wind } from "lucide-react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import { useThemeColors } from "@/theme/useAppTheme";

// M7: five tabs, Settings deliberately not among them — it is pushed from the
// gear in the Home header. "Defter" groups Günlük | Rüyalar | İçgörüler behind
// one tab; those segments arrive in Faz 2.
export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useThemeColors();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.canvas },
        headerTintColor: colors.ink,
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: colors.canvas },
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.line },
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.inkMute,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.nav.home,
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          // M7: Settings is not a tab — this gear is its only entry point.
          headerRight: () => <SettingsButton />,
        }}
      />
      <Tabs.Screen
        name="session"
        options={{
          title: t.nav.session,
          tabBarIcon: ({ color, size }) => <MessageSquare size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: t.nav.notebook,
          tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="breathe"
        options={{
          title: t.nav.breathe,
          tabBarIcon: ({ color, size }) => <Wind size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="analyses"
        options={{
          title: t.nav.analyses,
          tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

function SettingsButton() {
  const { t } = useTranslation();
  const { colors } = useThemeColors();

  return (
    <Link href="/settings" asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.nav.settings}
        className="mr-2 rounded-lg p-2 active:bg-raised"
      >
        <Settings size={22} color={colors.ink} />
      </Pressable>
    </Link>
  );
}
