import { Link } from "expo-router";
import { useFocusEffect } from "expo-router/react-navigation";
import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
} from "react-native";

// ✅ Import du service et du type
import { apiListSeries, ApiSeries } from "../../services/series.api";

export default function SeriesScreen() {
  const [q, setQ] = useState("");
  const [series, setSeries] = useState<ApiSeries[]>([]); // ✅ Stockage des données réelles
  const [loading, setLoading] = useState(true);

  // ✅ Chargement des données au montage
  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const res = await apiListSeries();
          setSeries(res.series ?? []);
        } catch (e) {
          console.error("Erreur chargement séries:", e);
        } finally {
          setLoading(false);
        }
      })();
    }, []),
  );

  // ✅ Filtrage sur les données chargées
  const data = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return series;
    return series.filter((x) => x.title.toLowerCase().includes(s));
  }, [q, series]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#0B1220",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color="#60A5FA" size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0B1220" }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
      >
        <Text style={{ color: "#EAF0FF", fontSize: 22, fontWeight: "900" }}>
          Séries
        </Text>
        <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 6 }}>
          Choisis une série et avance pas à pas.
        </Text>

        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Rechercher une série..."
          placeholderTextColor="rgba(234,240,255,0.45)"
          style={{
            marginTop: 14,
            backgroundColor: "#0F1A2C",
            borderWidth: 1,
            borderColor: "rgba(234,240,255,0.10)",
            borderRadius: 14,
            paddingHorizontal: 12,
            paddingVertical: 12,
            color: "#EAF0FF",
          }}
        />

        <View style={{ marginTop: 14, gap: 12 }}>
          {data.map((s) => (
            <Link key={s.id} href={`/series/${s.slug}`} asChild>
              <Pressable
                style={{
                  borderRadius: 18,
                  overflow: "hidden",
                  backgroundColor: "#0F1A2C",
                  borderWidth: 1,
                  borderColor: "rgba(234,240,255,0.10)",
                }}
              >
                {/* ✅ Utilisation de coverUrl (avec fallback si null) */}
                {s.coverUrl ? (
                  <Image
                    source={{ uri: s.coverUrl }}
                    style={{ width: "100%", height: 150 }}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={{
                      width: "100%",
                      height: 150,
                      backgroundColor: "#1E293B",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: "rgba(234,240,255,0.3)" }}>
                      Sans image
                    </Text>
                  </View>
                )}

                <View style={{ padding: 12 }}>
                  <Text
                    style={{
                      color: "#EAF0FF",
                      fontSize: 16,
                      fontWeight: "900",
                    }}
                  >
                    {s.title}
                  </Text>

                  {s.description ? (
                    <Text
                      style={{ color: "rgba(234,240,255,0.72)", marginTop: 6 }}
                      numberOfLines={2}
                    >
                      {s.description}
                    </Text>
                  ) : null}

                  <View
                    style={{
                      marginTop: 10,
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={{ color: "#60A5FA", fontWeight: "900" }}>
                      Ouvrir →
                    </Text>
                    {/* ✅ Utilisation de _count pour le nombre d'épisodes */}
                    <Text style={{ color: "rgba(234,240,255,0.60)" }}>
                      {s._count?.meditations ?? 0} épisodes
                    </Text>
                  </View>
                </View>
              </Pressable>
            </Link>
          ))}

          {data.length === 0 && (
            <View
              style={{
                marginTop: 10,
                padding: 14,
                borderRadius: 18,
                backgroundColor: "#0F1A2C",
                borderWidth: 1,
                borderColor: "rgba(234,240,255,0.10)",
              }}
            >
              <Text style={{ color: "rgba(234,240,255,0.72)" }}>
                Aucune série trouvée.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
