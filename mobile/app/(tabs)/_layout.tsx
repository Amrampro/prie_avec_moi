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

      <Tabs.Screen name="programs" options={{ title: "Programmes", tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="more" options={{ title: "Plus", tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="tracking" options={{ title: "Mon suivi", tabBarIcon: ({ color, size }) => <Ionicons name="checkmark-circle-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="account" options={{ title: "Mon compte", tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="series" options={{ href: null }} />
      <Tabs.Screen name="feed" options={{ href: null }} />
      <Tabs.Screen name="favorites" options={{ href: null }} />
      <Tabs.Screen name="events" options={{ href: null }} />
    </Tabs>
    
  );
}
