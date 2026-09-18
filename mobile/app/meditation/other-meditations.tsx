// mobile/app/meditation/other-meditations.tsx
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router/react-navigation";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";

import { apiStandaloneMeditations } from "../../services/meditations.api";

export default function OtherMeditationsScreen() {
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [items, setItems] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<any>(null);

  const loadFirst = useCallback(async () => {
    const res = await apiStandaloneMeditations({ limit: 20 });
    setItems(res.meditations ?? []);
    setNextCursor(res.nextCursor ?? null);
  }, []);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;

    setLoadingMore(true);
    try {
      const res = await apiStandaloneMeditations({
        limit: 20,
        cursorId: nextCursor.cursorId,
        cursorCreatedAt: nextCursor.cursorCreatedAt,
      });

      setItems((prev) => [...prev, ...(res.meditations ?? [])]);
      setNextCursor(res.nextCursor ?? null);
    } catch (e: any) {
      Alert.alert("Erreur", e?.message ?? "Impossible de charger plus.");
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      (async () => {
        try {
          setLoading(true);
          await loadFirst();
        } catch (e: any) {
          if (mounted) {
            setItems([]);
            setNextCursor(null);
            Alert.alert("Erreur", e?.message ?? "Chargement impossible.");
          }
        } finally {
          if (mounted) setLoading(false);
        }
      })();

      return () => {
        mounted = false;
      };
    }, [loadFirst])
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#0B1220", paddingTop: insets.top }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
      >
        <Text style={{ color: "#EAF0FF", fontSize: 22, fontWeight: "900" }}>
          Autres méditations
        </Text>
        <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 6 }}>
          Méditations sans série
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
              <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 10 }}>
                Chargement...
              </Text>
            </View>
          ) : items.length === 0 ? (
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
                Aucune méditation disponible.
              </Text>
            </View>
          ) : (
            items.map((m) => (
              <Link key={m.id} href={`/meditation/${m.slug}`} asChild>
                <Pressable
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    padding: 12,
                    borderRadius: 18,
                    backgroundColor: "#0F1A2C",
                    borderWidth: 1,
                    borderColor: "rgba(234,240,255,0.10)",
                  }}
                >
                  <View
                    style={{
                      width: 74,
                      height: 74,
                      borderRadius: 16,
                      overflow: "hidden",
                      backgroundColor: "#0B1220",
                      borderWidth: 1,
                      borderColor: "rgba(234,240,255,0.10)",
                    }}
                  >
                    <Image
                      source={{
                        uri: m.imageUrl ?? "https://picsum.photos/seed/medit/900/900",
                      }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#EAF0FF", fontWeight: "900" }} numberOfLines={1}>
                      {m.isPremium ? "🔒 Premium • " : ""}{m.title}
                    </Text>

                    <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 4 }} numberOfLines={2}>
                      {m.footerText ?? "—"}
                    </Text>

                    <Text style={{ color: "rgba(234,240,255,0.55)", marginTop: 4, fontWeight: "800", fontSize: 12 }}>
                      {new Date(m.createdAt).toLocaleDateString("fr-FR")}
                      {m.audioDuration ? ` • ⏱ ${m.audioDuration}` : ""}
                    </Text>
                  </View>

                  <Ionicons name="chevron-forward" size={18} color="rgba(234,240,255,0.55)" />
                </Pressable>
              </Link>
            ))
          )}
        </View>

        {/* Load more */}
        {!loading && items.length > 0 && (
          <View style={{ marginTop: 14 }}>
            <Pressable
              onPress={loadMore}
              disabled={!nextCursor || loadingMore}
              style={{
                paddingVertical: 12,
                borderRadius: 18,
                backgroundColor: nextCursor ? "rgba(37,99,235,0.14)" : "rgba(255,255,255,0.06)",
                borderWidth: 1,
                borderColor: "rgba(234,240,255,0.10)",
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 10,
                opacity: !nextCursor ? 0.55 : 1,
              }}
            >
              {loadingMore ? <ActivityIndicator /> : <Ionicons name="download-outline" size={18} color="#EAF0FF" />}
              <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
                {nextCursor ? "Charger plus" : "Fin"}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}