import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, Image, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "expo-router/react-navigation";
import { apiGetEvent } from "../../services/events.api";

function formatDT(d: string) {
  try {
    return new Date(d).toLocaleString("fr-FR");
  } catch {
    return d;
  }
}

export default function EventDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      (async () => {
        try {
          setLoading(true);
          const res = await apiGetEvent(id);
          if (mounted) setEvent(res.event ?? null);
        } finally {
          if (mounted) setLoading(false);
        }
      })();

      return () => {
        mounted = false;
      };
    }, [id])
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0B1220", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0B1220", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>Évènement introuvable.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0B1220", paddingTop: insets.top }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}>
        {!!event.imageUrl && (
          <View
            style={{
              borderRadius: 18,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: "rgba(234,240,255,0.10)",
              backgroundColor: "#0F1A2C",
            }}
          >
            <Image source={{ uri: event.imageUrl }} style={{ width: "100%", height: 220 }} />
          </View>
        )}

        <Text style={{ color: "#EAF0FF", fontSize: 22, fontWeight: "900", marginTop: 14 }}>
          {event.name}
        </Text>

        <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 6 }}>
          {event.place ?? "—"} • {event.address ?? "—"}
        </Text>

        <View
          style={{
            marginTop: 12,
            padding: 14,
            borderRadius: 18,
            backgroundColor: "#0F1A2C",
            borderWidth: 1,
            borderColor: "rgba(234,240,255,0.10)",
          }}
        >
          <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>Dates</Text>
          <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 6 }}>Début : {formatDT(event.startDate)}</Text>
          <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 4 }}>Fin : {formatDT(event.endDate)}</Text>
        </View>

        {!!event.theme && (
          <View style={{ marginTop: 12, padding: 14, borderRadius: 18, backgroundColor: "#0F1A2C", borderWidth: 1, borderColor: "rgba(234,240,255,0.10)" }}>
            <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>Thème</Text>
            <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 6 }}>{event.theme}</Text>
          </View>
        )}

        {!!event.description && (
          <View style={{ marginTop: 12, padding: 14, borderRadius: 18, backgroundColor: "#0F1A2C", borderWidth: 1, borderColor: "rgba(234,240,255,0.10)" }}>
            <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>Description</Text>
            <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 6, lineHeight: 20 }}>
              {event.description}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
