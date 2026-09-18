import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router/react-navigation";
import { router } from "expo-router";

import {
  apiAdminDeleteEvent,
  apiAdminListEvents,
  apiAdminPublishEvent,
  apiAdminUnpublishEvent,
} from "../../../../services/admin.events.api";

export default function AdminEventsScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);

  const load = useCallback(async () => {
    const res = await apiAdminListEvents();
    setEvents(res.events ?? []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      (async () => {
        try {
          setLoading(true);
          await load();
        } catch {
          if (mounted) setEvents([]);
        } finally {
          if (mounted) setLoading(false);
        }
      })();

      return () => {
        mounted = false;
      };
    }, [load])
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#0B1220", paddingTop: insets.top }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}>
        <Text style={{ color: "#EAF0FF", fontSize: 22, fontWeight: "900" }}>Administration</Text>
        <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 6 }}>Évènements</Text>

        <View style={{ marginTop: 14 }}>
          <Pressable
            onPress={() => router.push("/settings/admin/events/new")}
            style={{
              paddingVertical: 12,
              borderRadius: 18,
              backgroundColor: "#2563EB",
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Ionicons name="add" size={18} color="#EAF0FF" />
            <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>Nouvel évènement</Text>
          </Pressable>
        </View>

        <View style={{ marginTop: 14, gap: 10 }}>
          {loading ? (
            <View style={{ padding: 14, borderRadius: 18, backgroundColor: "#0F1A2C", borderWidth: 1, borderColor: "rgba(234,240,255,0.10)", alignItems: "center" }}>
              <ActivityIndicator />
              <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 10 }}>Chargement...</Text>
            </View>
          ) : events.length === 0 ? (
            <View style={{ padding: 14, borderRadius: 18, backgroundColor: "#0F1A2C", borderWidth: 1, borderColor: "rgba(234,240,255,0.10)" }}>
              <Text style={{ color: "rgba(234,240,255,0.72)" }}>Aucun évènement.</Text>
            </View>
          ) : (
            events.map((e) => (
              <View
                key={e.id}
                style={{
                  padding: 12,
                  borderRadius: 18,
                  backgroundColor: "#0F1A2C",
                  borderWidth: 1,
                  borderColor: "rgba(234,240,255,0.10)",
                }}
              >
                <Text style={{ color: "#EAF0FF", fontWeight: "900" }} numberOfLines={1}>
                  {e.name}
                </Text>
                <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 4 }} numberOfLines={1}>
                  {new Date(e.startDate).toLocaleString("fr-FR")} → {new Date(e.endDate).toLocaleString("fr-FR")} •{" "}
                  {e.isPublished ? "Publié" : "Brouillon"}
                </Text>

                <View style={{ marginTop: 10, flexDirection: "row", gap: 10 }}>
                  <Pressable
                    onPress={async () => {
                      try {
                        if (e.isPublished) await apiAdminUnpublishEvent(e.id);
                        else await apiAdminPublishEvent(e.id);
                        await load();
                      } catch (err: any) {
                        Alert.alert("Erreur", err?.message ?? "Action impossible");
                      }
                    }}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 14,
                      backgroundColor: "rgba(37,99,235,0.14)",
                      borderWidth: 1,
                      borderColor: "rgba(234,240,255,0.10)",
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <Ionicons name={e.isPublished ? "eye-off-outline" : "eye-outline"} size={16} color="#EAF0FF" />
                    <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
                      {e.isPublished ? "Dépublier" : "Publier"}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => router.push(`/settings/admin/events/${e.id}`)}
                    style={{
                      width: 54,
                      paddingVertical: 10,
                      borderRadius: 14,
                      backgroundColor: "#0B1220",
                      borderWidth: 1,
                      borderColor: "rgba(234,240,255,0.10)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="open-outline" size={18} color="#EAF0FF" />
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      Alert.alert("Supprimer", "Supprimer cet évènement ?", [
                        { text: "Annuler", style: "cancel" },
                        {
                          text: "Supprimer",
                          style: "destructive",
                          onPress: async () => {
                            try {
                              await apiAdminDeleteEvent(e.id);
                              await load();
                            } catch (err: any) {
                              Alert.alert("Erreur", err?.message ?? "Suppression impossible");
                            }
                          },
                        },
                      ]);
                    }}
                    style={{
                      width: 54,
                      paddingVertical: 10,
                      borderRadius: 14,
                      backgroundColor: "rgba(255,255,255,0.06)",
                      borderWidth: 1,
                      borderColor: "rgba(234,240,255,0.10)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EAF0FF" />
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
