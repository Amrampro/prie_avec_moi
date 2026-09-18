import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, Pressable, Image, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { useFocusEffect } from "expo-router/react-navigation";
import { apiListEvents } from "../../services/events.api";

function formatDT(d: string) {
  try {
    return new Date(d).toLocaleString("fr-FR");
  } catch {
    return d;
  }
}

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      (async () => {
        try {
          setLoading(true);
          const res = await apiListEvents();
          if (mounted) setEvents(res.events ?? []);
        } finally {
          if (mounted) setLoading(false);
        }
      })();

      return () => {
        mounted = false;
      };
    }, [])
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#0B1220", paddingTop: insets.top }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}>
        <Text style={{ color: "#EAF0FF", fontSize: 22, fontWeight: "900" }}>Évènements</Text>
        <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 6 }}>
          Du plus proche au plus loin.
        </Text>

        <View style={{ marginTop: 14, gap: 10 }}>
          {loading ? (
            <View
              style={{
                padding: 14,
                borderRadius: 18,
                backgroundColor: "#0F1A2C",
                borderWidth: 1,
                borderColor: "rgba(234,240,255,0.10)",
                alignItems: "center",
              }}
            >
              <ActivityIndicator />
              <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 10 }}>Chargement...</Text>
            </View>
          ) : events.length === 0 ? (
            <View
              style={{
                padding: 14,
                borderRadius: 18,
                backgroundColor: "#0F1A2C",
                borderWidth: 1,
                borderColor: "rgba(234,240,255,0.10)",
              }}
            >
              <Text style={{ color: "rgba(234,240,255,0.72)" }}>Aucun évènement.</Text>
            </View>
          ) : (
            events.map((e) => (
              <Link key={e.id} href={`/events/${e.id}`} asChild>
                <Pressable
                  style={{
                    borderRadius: 18,
                    overflow: "hidden",
                    backgroundColor: "#0F1A2C",
                    borderWidth: 1,
                    borderColor: "rgba(234,240,255,0.10)",
                  }}
                >
                  {!!e.imageUrl && <Image source={{ uri: e.imageUrl }} style={{ width: "100%", height: 150 }} />}

                  <View style={{ padding: 12 }}>
                    <Text style={{ color: "#EAF0FF", fontWeight: "900" }} numberOfLines={1}>
                      {e.name}
                    </Text>
                    <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 4 }} numberOfLines={1}>
                      {e.place ?? "—"} • {formatDT(e.startDate)}
                    </Text>
                  </View>
                </Pressable>
              </Link>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
