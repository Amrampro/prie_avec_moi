// mobile/app/settings/_layout.tsx
import { Stack } from "expo-router";

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#0F1A2C" },
        headerTintColor: "#EAF0FF",
        headerTitleStyle: { fontWeight: "800" },
        contentStyle: { backgroundColor: "#0B1220" },
      }}
    >
      {/* Settings home (if you have mobile/app/settings/index.tsx) */}
      <Stack.Screen name="index" options={{ title: "Paramètres" }} />

      {/* Settings pages (your screenshot shows these files exist) */}
      <Stack.Screen name="premium" options={{ title: "Activer Premium" }} />
      <Stack.Screen name="edit" options={{ title: "Modifier mon profil" }} />
      <Stack.Screen name="delete" options={{ title: "Supprimer mon compte" }} />
      <Stack.Screen name="terms" options={{ title: "Termes & conditions" }} />

      {/* Optional screens you have in settings/ */}
      {/* <Stack.Screen name="series" options={{ title: "Mes séries" }} />
      <Stack.Screen name="meditations" options={{ title: "Mes méditations" }} /> */}

      {/* Admin subtree */}
      <Stack.Screen name="admin" options={{ headerShown: false }} />
      <Stack.Screen name="posts" options={{ headerShown: false }} />
    </Stack>
  );
}
