// mobile/app/_layout.tsx
import { Stack, Redirect, useSegments } from "expo-router";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useAuthStore } from "../stores/auth.store";

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);

  const segments = useSegments();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#0B1220",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color="#60A5FA" />
      </View>
    );
  }

  const isAuthRoute =
    segments[0] === "sign-in" ||
    segments[0] === "sign-up" ||
    segments[0] === "terms";

  const isProtectedRoute =
    segments[0] === "settings" &&
    typeof segments[1] === "string" &&
    segments[1] !== "terms";

  if (!token && isProtectedRoute) {
    return <Redirect href="/sign-in" />;
  }

  if (token && isAuthRoute) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#0F1A2C" },
        headerTintColor: "#EAF0FF",
        headerTitleStyle: { fontWeight: "800" },
        contentStyle: { backgroundColor: "#0B1220" },
      }}
    >
      {/* Splash entry */}
      <Stack.Screen name="index" options={{ headerShown: false }} />

      {/* Auth */}
      <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      <Stack.Screen name="sign-up" options={{ headerShown: false }} />
      <Stack.Screen
        name="terms"
        options={{ headerShown: true, title: "Conditions d'utilisation" }}
      />

      {/* App */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* Details */}
      <Stack.Screen name="series/[slug]" options={{ title: "Série" }} />
      <Stack.Screen name="meditation/[slug]" options={{ title: "Méditation" }} />
      <Stack.Screen name="meditation/other-meditations" options={{ title: "Autres méditations" }} />

      
      {/* Posts */}
      <Stack.Screen name="post/[id]" options={{ title: "Publication" }} />

      {/* Notifications */}
      <Stack.Screen name="notifications/index" options={{ title: "Notifications" }} />
      <Stack.Screen name="notifications/[id]" options={{ title: "Notification" }} />

      <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />

      {/* ✅ Do NOT declare settings/admin screens here anymore */}
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}
