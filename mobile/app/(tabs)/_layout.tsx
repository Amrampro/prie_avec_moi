// mobile/app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        // headerShown: false, // on gère les headers au cas par cas dans les écrans
        headerTitleStyle: { fontWeight: "800" },
        headerStyle: { backgroundColor: "#0F1A2C" },
        headerTintColor: "#EAF0FF",

        tabBarActiveTintColor: "#60A5FA",
        tabBarInactiveTintColor: "rgba(234,240,255,0.55)",

        tabBarStyle: {
          backgroundColor: "#111F35",
          borderTopColor: "rgba(234,240,255,0.10)",

          // ✅ Remonter visuellement la tabbar
          height: 56 + Math.max(0, insets.bottom - 10),
          paddingTop: 6,
          paddingBottom: Math.max(6, insets.bottom - 16), // <-- clé
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "800" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          headerShown: false, // ✅ on mettra notre header custom sur Home
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="series"
        options={{
          title: "Séries",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? "albums" : "albums-outline"} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="feed"
        options={{
          title: "Actualités",
          headerShown: false, // ✅ on mettra notre header custom sur Feed
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? "globe" : "globe-outline"} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="favorites"
        options={{
          title: "Favoris",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? "heart" : "heart-outline"} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="events"
        options={{
          title: "Événements",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? "calendar" : "calendar-outline"} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
    
  );
}
