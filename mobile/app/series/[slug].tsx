import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Image, Pressable, ActivityIndicator } from "react-native";
import { Link, useLocalSearchParams } from "expo-router";

// ✅ Import services et types
import { apiSeriesDetail, ApiSeries } from "../../services/series.api";

export default function SeriesDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  
  const [series, setSeries] = useState<ApiSeries | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    (async () => {
      try {
        const res = await apiSeriesDetail(slug);
        setSeries(res.series);
      } catch (e) {
        console.error("Erreur chargement série:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0B1220", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#60A5FA" size="large" />
      </View>
    );
  }

  if (!series) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0B1220", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>Série introuvable.</Text>
        <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 6 }}>Retourne à la liste des séries.</Text>
        <Link href="/(tabs)/series" style={{ color: "#60A5FA", fontWeight: "900", marginTop: 10 }}>
          ← Séries
        </Link>
      </View>
    );
  }

  // ✅ Les épisodes viennent maintenant de l'API (via le `include` dans le backend)
  // On suppose que l'API renvoie `meditations` dans l'objet série.
  // Si ton API ne renvoie pas encore les méditations, il faudra ajuster le backend ou la requête.
  const episodes = series.meditations ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: "#0B1220" }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
      >
        {/* Hero */}
        <View
          style={{
            borderRadius: 18,
            overflow: "hidden",
            backgroundColor: "#0F1A2C",
            borderWidth: 1,
            borderColor: "rgba(234,240,255,0.10)",
          }}
        >
          {series.coverUrl ? (
            <Image source={{ uri: series.coverUrl }} style={{ width: "100%", height: 190 }} resizeMode="cover" />
          ) : (
             <View style={{ width: "100%", height: 190, backgroundColor: "#1E293B", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "rgba(234,240,255,0.3)" }}>Sans image</Text>
             </View>
          )}

          <View style={{ padding: 14 }}>
            <Text style={{ color: "#EAF0FF", fontSize: 20, fontWeight: "900" }}>
              {series.title}
            </Text>
            {series.description ? (
                <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 8, lineHeight: 20 }}>
                {series.description}
                </Text>
            ) : null}

            <View style={{ marginTop: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: "#60A5FA", fontWeight: "900" }}>
                {episodes.length} épisode{episodes.length > 1 ? "s" : ""}
              </Text>
              <Text style={{ color: "rgba(234,240,255,0.60)" }}>
                Série
              </Text>
            </View>
          </View>
        </View>

        {/* Episodes Header */}
        <View style={{ marginTop: 24, marginBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: "#EAF0FF", fontSize: 18, fontWeight: "900" }}>Épisodes</Text>
        </View>

        {/* Liste des épisodes */}
        <View style={{ gap: 10 }}>
          {episodes.map((m, idx) => (
            <Link key={m.id} href={`/meditation/${m.slug}`} asChild>
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
                {/* Image miniature de l'épisode ou placeholder */}
                {m.imageUrl ? (
                    <Image
                    source={{ uri: m.imageUrl }}
                    style={{ width: 64, height: 64, borderRadius: 16 }}
                    resizeMode="cover"
                    />
                ) : (
                    <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: "#1E293B", alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ fontSize: 10, color: "rgba(234,240,255,0.3)" }}>Img</Text>
                    </View>
                )}

                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#EAF0FF", fontWeight: "900" }} numberOfLines={1}>
                    Épisode {idx + 1} • {m.isPremium ? "🔒 Premium • " : ""}{m.title}
                  </Text>
                  <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 4 }} numberOfLines={1}>
                    Audio • {m.audioDuration ?? "—"}
                  </Text>
                </View>

                <Text style={{ color: "#60A5FA", fontWeight: "900" }}>→</Text>
              </Pressable>
            </Link>
          ))}

          {episodes.length === 0 && (
            <View
              style={{
                padding: 14,
                borderRadius: 18,
                backgroundColor: "#0F1A2C",
                borderWidth: 1,
                borderColor: "rgba(234,240,255,0.10)",
                alignItems: "center"
              }}
            >
              <Text style={{ color: "rgba(234,240,255,0.72)" }}>
                Aucun épisode pour le moment.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}