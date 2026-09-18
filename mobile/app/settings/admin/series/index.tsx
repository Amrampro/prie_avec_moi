import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router/react-navigation";
import { router } from "expo-router";

import {
  apiAdminDeleteSeries,
  apiAdminListSeries,
  apiAdminPublishSeries,
  apiAdminUnpublishSeries,
} from "../../../../services/admin.series.api";

export default function AdminSeriesScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [series, setSeries] = useState<any[]>([]);

  const load = useCallback(async () => {
    const res = await apiAdminListSeries();
    setSeries(res.series ?? []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      (async () => {
        try {
          setLoading(true);
          await load();
        } catch (e: any) {
          if (mounted) setSeries([]);
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
    <View
      style={{ flex: 1, backgroundColor: "#0B1220", paddingTop: insets.top }}
    >
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <Text style={{ color: "#EAF0FF", fontSize: 22, fontWeight: "900" }}>
          Administration
        </Text>
        <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 6 }}>
          Séries
        </Text>

        <View style={{ marginTop: 14 }}>
          <Pressable
            onPress={() => router.push("/settings/admin/series/new")}
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
            <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
              Nouvelle série
            </Text>
          </Pressable>
        </View>

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
              <Text
                style={{ color: "rgba(234,240,255,0.72)", marginTop: 10 }}
              >
                Chargement...
              </Text>
            </View>
          ) : series.length === 0 ? (
            <View
              style={{
                padding: 14,
                borderRadius: 18,
                backgroundColor: "#0F1A2C",
                borderWidth: 1,
                borderColor: "rgba(234,240,255,0.10)",
              }}
            >
              <Text style={{ color: "rgba(234,240,255,0.72)" }}>
                Aucune série.
              </Text>
            </View>
          ) : (
            series.map((s) => (
              <View
                key={s.id}
                style={{
                  padding: 12,
                  borderRadius: 18,
                  backgroundColor: "#0F1A2C",
                  borderWidth: 1,
                  borderColor: "rgba(234,240,255,0.10)",
                }}
              >
                <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
                  {s.title}
                </Text>
                <Text
                  style={{ color: "rgba(234,240,255,0.72)", marginTop: 4 }}
                >
                  Slug: {s.slug} • {s.isPublished ? "Publié" : "Brouillon"}
                </Text>

                <View
                  style={{
                    marginTop: 10,
                    flexDirection: "row",
                    gap: 10,
                  }}
                >
                  {/* Publier / Dépublier */}
                  <Pressable
                    onPress={async () => {
                      try {
                        if (s.isPublished) await apiAdminUnpublishSeries(s.id);
                        else await apiAdminPublishSeries(s.id);
                        await load();
                      } catch (e: any) {
                        Alert.alert("Erreur", e?.message ?? "Action impossible");
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
                    <Ionicons
                      name={s.isPublished ? "eye-off-outline" : "eye-outline"}
                      size={16}
                      color="#EAF0FF"
                    />
                    <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
                      {s.isPublished ? "Dépublier" : "Publier"}
                    </Text>
                  </Pressable>

                  {/* ✅ Voir (Edit) */}
                  <Pressable
                    onPress={() => router.push(`/settings/admin/series/${s.id}`)}
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

                  {/* Supprimer */}
                  <Pressable
                    onPress={() => {
                      Alert.alert("Supprimer", "Supprimer cette série ?", [
                        { text: "Annuler", style: "cancel" },
                        {
                          text: "Supprimer",
                          style: "destructive",
                          onPress: async () => {
                            try {
                              await apiAdminDeleteSeries(s.id);
                              await load();
                            } catch (e: any) {
                              Alert.alert(
                                "Erreur",
                                e?.message ?? "Suppression impossible"
                              );
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
