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
      <Stack.Screen name="premium-codes" options={{ title: "Admin • Codes Premium" }} />
      {/* SERIES */}
      <Stack.Screen name="series/index" options={{ title: "Admin • Séries" }} />
      <Stack.Screen name="series/new" options={{ title: "Nouvelle série" }} />
      <Stack.Screen name="series/[id]" options={{ title: "Modifier la série" }} />

      {/* MEDITATIONS */}
      <Stack.Screen name="meditations/index" options={{ title: "Admin • Méditations" }} />
      <Stack.Screen name="meditations/new" options={{ title: "Nouvelle méditation" }} />
      <Stack.Screen name="meditations/[id]" options={{ title: "Modifier la méditation" }} />

      {/* EVENTS */}
      <Stack.Screen name="events/index" options={{ title: "Admin • Évènements" }} />
      <Stack.Screen name="events/new" options={{ title: "Nouvel évènement" }} />
      <Stack.Screen name="events/[id]" options={{ title: "Modifier l'évènement" }} />

      {/* POSTS */}
      <Stack.Screen name="posts/index" options={{ title: "Admin • Actualités" }} />
      <Stack.Screen name="posts/new" options={{ title: "Nouvelle publication" }} />
      <Stack.Screen name="posts/[id]" options={{ title: "Modifier la publication" }} />

      {/* USERS */}
      <Stack.Screen name="users/index" options={{ title: "Admin • Utilisateurs" }} />
      <Stack.Screen name="users/[id]" options={{ title: "Détails utilisateur" }} />
    </Stack>
  );
}
