import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, Pressable, Image, ActivityIndicator, RefreshControl } from "react-native";
import { Link, router } from "expo-router";
import { useFocusEffect } from "expo-router/react-navigation";
import { apiListFavorites } from "../../services/favorites.api";
import { useAuthStore } from "../../stores/auth.store";

export default function FavoritesScreen() {
  const token = useAuthStore((s) => s.token);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(Boolean(token));
  const [refreshing, setRefreshing] = useState(false);

  const loadFavorites = useCallback(async () => {
    if (!token) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    const res = await apiListFavorites();
    setFavorites(Array.isArray(res?.favorites) ? res.favorites : []);
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      (async () => {
        try {
          setLoading(true);
          await loadFavorites();
        } catch (e) {
          // Optionnel: afficher une erreur
          if (mounted) setFavorites([]);
        } finally {
          if (mounted) setLoading(false);
        }
      })();

      return () => {
        mounted = false;
      };
    }, [loadFavorites])
  );

  const onRefresh = useCallback(async () => {
    if (!token) return;

    try {
      setRefreshing(true);
      await loadFavorites();
    } finally {
      setRefreshing(false);
    }
  }, [loadFavorites, token]);

  return (
    <View style={{ flex: 1, backgroundColor: "#0B1220" }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={{ color: "#EAF0FF", fontSize: 22, fontWeight: "900" }}>Favoris</Text>
        <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 6 }}>
          Tes méditations à garder sous la main.
        </Text>

        <View style={{ marginTop: 14, gap: 10 }}>
          {!token ? (
            <View
              style={{
                padding: 14,
                borderRadius: 18,
                backgroundColor: "#0F1A2C",
                borderWidth: 1,
                borderColor: "rgba(234,240,255,0.10)",
              }}
            >
              <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>Connexion requise</Text>
              <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 6 }}>
                Connecte-toi pour voir tes favoris et les retrouver sur tous tes appareils.
              </Text>
              <Pressable
                onPress={() => router.push("/sign-in")}
                style={{
                  marginTop: 12,
                  paddingVertical: 12,
                  borderRadius: 16,
                  backgroundColor: "#2563EB",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>Se connecter</Text>
              </Pressable>
            </View>
          ) : loading ? (
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
          ) : favorites.length === 0 ? (
            <View
              style={{
                padding: 14,
                borderRadius: 18,
                backgroundColor: "#0F1A2C",
                borderWidth: 1,
                borderColor: "rgba(234,240,255,0.10)",
              }}
            >
              <Text style={{ color: "rgba(234,240,255,0.72)" }}>Aucun favori pour le moment.</Text>
            </View>
          ) : (
            favorites.map((f) => {
              const m = f.meditation;
              if (!m) return null;

              return (
                <Link key={f.id} href={`/meditation/${m.slug}`} asChild>
                  <Pressable
                    style={{
                      borderRadius: 18,
                      backgroundColor: "#0F1A2C",
                      borderWidth: 1,
                      borderColor: "rgba(234,240,255,0.10)",
                      padding: 12,
                      flexDirection: "row",
                      gap: 12,
                      alignItems: "center",
                    }}
                  >
                    <Image
                      source={{ uri: m.imageUrl ?? "https://picsum.photos/seed/fav/200/200" }}
                      style={{ width: 64, height: 64, borderRadius: 16 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#EAF0FF", fontWeight: "900" }} numberOfLines={1}>
                        {m.isPremium ? "🔒 Premium • " : ""}{m.title}
                      </Text>
                      <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 4 }} numberOfLines={1}>
                        Audio • {m.audioDuration ?? "—"}
                      </Text>
                    </View>
                    <Text style={{ color: "#60A5FA", fontWeight: "900" }}>→</Text>
                  </Pressable>
                </Link>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}
