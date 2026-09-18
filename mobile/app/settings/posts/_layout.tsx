// mobile/app/settings/admin/_layout.tsx
import { Stack } from "expo-router";

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#0F1A2C" },
        headerTintColor: "#EAF0FF",
        headerTitleStyle: { fontWeight: "800" },
        contentStyle: { backgroundColor: "#0B1220" },
      }}
    >

      {/* POSTS */}
      <Stack.Screen name="index" options={{ title: "Mes Publications" }} />
      <Stack.Screen name="new" options={{ title: "Nouvelle publication" }} />
      <Stack.Screen name="[id]" options={{ title: "Modifier ma publication" }} />
    </Stack>
  );
}
