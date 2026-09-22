import { PrayerHome } from "../../components/PrayerScreens";
import { PremiumBadge } from "../../components/PremiumBadge";
// app/(tabs)/index.tsx
import { Link, router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router/react-navigation";
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  apiDailyMeditation,
  apiStandaloneMeditations,
} from "../../services/meditations.api";
import { apiListSeries } from "../../services/series.api";
import { useAuthStore } from "../../stores/auth.store";
import { apiHomeEvents } from "../../services/events.api";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [daily, setDaily] = useState<any>(null);
  const [series, setSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const avatarUri = useMemo(() => {
    return user?.avatarUrl ?? null;
  }, [user]);

  const fullName = useMemo(() => {
    return user?.fullName ?? "User not connected";
  }, [user]);

  const [homeEvents, setHomeEvents] = useState<any[]>([]);
  const [otherMeditations, setOtherMeditations] = useState<any[]>([]);



  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      setDaily(null);
      setLoading(true);

      (async () => {
        try {
          const [d, s, om] = await Promise.all([
            apiDailyMeditation(),
            apiListSeries(),
            apiStandaloneMeditations({ limit: 3 }), // 👈 on prend juste 3 pour l'aperçu
          ]);

          if (!mounted) return;

          setDaily(d?.meditation ?? null);
          setSeries(Array.isArray(s?.series) ? s.series : []);
          setOtherMeditations(
            Array.isArray(om?.meditations) ? om.meditations : [],
          );

          const ev = await apiHomeEvents();
          setHomeEvents(ev.events ?? []);
        } catch (e: any) {
          // MVP: simple. Plus tard: toast + retry
          console.log("Home fetch error:", e?.message);
          if (mounted) {
            setDaily(null);
            setSeries([]);
            setOtherMeditations([]);
          }
        } finally {
          if (mounted) setLoading(false);
        }
      })();

      return () => {
        mounted = false;
      };
    }, [token]),
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#0B1220" }}>
      {/* Header safe-area iPhone */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: insets.top + 8,
          paddingBottom: 10,
          backgroundColor: "#0B1220",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Pressable
          onPress={() => router.push("/settings")}
          style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
        >
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "rgba(234,240,255,0.12)",
              }}
            />
          ) : (
            <View style={{ width: 40, height: 40 }} />
          )}
          <View>
            <Text style={{ color: "rgba(234,240,255,0.72)", fontSize: 12 }}>
              Bonjour
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                flexWrap: "nowrap",
              }}
            >
              <Text
                style={{
                  color: "#EAF0FF",
                  fontWeight: "900",
                  fontSize: 16,
                  flexShrink: 1,
                }}
                numberOfLines={1}
              >
                {fullName}
              </Text>

              <PremiumBadge account={user} size={18} />
            </View>
          </View>
        </Pressable>

        <Pressable
          onPress={() => router.push("/notifications")}
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            backgroundColor: "#0F1A2C",
            borderWidth: 1,
            borderColor: "rgba(234,240,255,0.10)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="notifications-outline" size={22} color="#EAF0FF" />
        </Pressable>
      </View>

      {/* Contenu */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
      >
        <PrayerHome />
        <Text style={{ color: "rgba(234,240,255,0.72)" }}>Aujourd’hui</Text>
        <Text
          style={{
            color: "#EAF0FF",
            fontSize: 26,
            fontWeight: "900",
            marginTop: 6,
          }}
        >
          Méditation du jour
        </Text>

        {/* Loading */}
        {loading ? (
          <View
            style={{
              marginTop: 14,
              borderRadius: 18,
              backgroundColor: "#0F1A2C",
              borderWidth: 1,
              borderColor: "rgba(234,240,255,0.10)",
              padding: 18,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ActivityIndicator />
            <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 10 }}>
              Chargement...
            </Text>
          </View>
        ) : daily ? (
          <Link href={`/meditation/${daily.slug}`} asChild>
            <Pressable
              style={{
                marginTop: 14,
                borderRadius: 18,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: "rgba(234,240,255,0.10)",
                backgroundColor: "#0F1A2C",
              }}
            >
              <Image
                source={{
                  uri:
                    daily.imageUrl ??
                    "https://picsum.photos/seed/daily/900/900",
                }}
                style={{ width: "100%", height: 220 }}
              />
              <View style={{ padding: 14 }}>
                <Text
                  style={{ color: "#EAF0FF", fontSize: 18, fontWeight: "800" }}
                >
                  {daily.isPremium ? "🔒 Premium • " : ""}{daily.title}
                </Text>
                <Text
                  style={{ color: "rgba(234,240,255,0.72)", marginTop: 6 }}
                  numberOfLines={2}
                >
                  {daily.isLocked ? "Cette méditation est réservée aux utilisateurs Premium." : daily.bodyText}
                </Text>
              </View>
            </Pressable>
          </Link>
        ) : (
          <View
            style={{
              marginTop: 14,
              borderRadius: 18,
              backgroundColor: "#0F1A2C",
              borderWidth: 1,
              borderColor: "rgba(234,240,255,0.10)",
              padding: 14,
            }}
          >
            <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
              Aucune méditation disponible
            </Text>
            <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 6 }}>
              Publie une méditation côté admin pour l’afficher ici.
            </Text>
          </View>
        )}

        {/* Series header */}
        <View
          style={{
            marginTop: 18,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#EAF0FF", fontSize: 18, fontWeight: "800" }}>
            Séries
          </Text>
          <Link
            href="/(tabs)/series"
            style={{ color: "#60A5FA", fontWeight: "800" }}
          >
            Voir tout
          </Link>
        </View>

        {/* Series list */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingVertical: 12 }}
        >
          {(series ?? []).slice(0, 3).map((s) => (
            <Link key={s.id} href={`/series/${s.slug}`} asChild>
              <Pressable
                style={{
                  width: 220,
                  borderRadius: 18,
                  overflow: "hidden",
                  backgroundColor: "#0F1A2C",
                  borderWidth: 1,
                  borderColor: "rgba(234,240,255,0.10)",
                }}
              >
                <Image
                  source={{
                    uri:
                      s.coverUrl ?? "https://picsum.photos/seed/series/900/900",
                  }}
                  style={{ width: "100%", height: 120 }}
                />
                <View style={{ padding: 12 }}>
                  <Text
                    style={{ color: "#EAF0FF", fontWeight: "800" }}
                    numberOfLines={1}
                  >
                    {s.title}
                  </Text>
                  <Text
                    style={{ color: "rgba(234,240,255,0.72)", marginTop: 4 }}
                    numberOfLines={2}
                  >
                    {s.description ?? ""}
                  </Text>
                </View>
              </Pressable>
            </Link>
          ))}

          {/* Empty state */}
          {!loading && (series?.length ?? 0) === 0 && (
            <View
              style={{
                width: 260,
                borderRadius: 18,
                backgroundColor: "#0F1A2C",
                borderWidth: 1,
                borderColor: "rgba(234,240,255,0.10)",
                padding: 14,
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
                Aucune série publiée
              </Text>
              <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 6 }}>
                Quand tu publies des séries côté admin, elles apparaîtront ici.
              </Text>
            </View>
          )}
        </ScrollView>
        <View
          style={{
            marginTop: 18,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#EAF0FF", fontSize: 18, fontWeight: "800" }}>
            Évènements
          </Text>
          <Link
            href="/(tabs)/events"
            style={{ color: "#60A5FA", fontWeight: "800" }}
          >
            Voir tout
          </Link>
        </View>

        <View style={{ marginTop: 12, gap: 10 }}>
          {homeEvents.length === 0 ? (
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
                Aucun évènement à venir.
              </Text>
            </View>
          ) : (
            homeEvents.slice(0, 3).map((e) => (
              <Link key={e.id} href={`/events/${e.id}`} asChild>
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
                  {/* Image Left */}
                  <View
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 16,
                      overflow: "hidden",
                      backgroundColor: "#0B1220",
                      borderWidth: 1,
                      borderColor: "rgba(234,240,255,0.10)",
                    }}
                  >
                    {e.imageUrl ? (
                      <Image
                        source={{ uri: e.imageUrl }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={{
                          flex: 1,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons
                          name="calendar-outline"
                          size={22}
                          color="rgba(234,240,255,0.5)"
                        />
                      </View>
                    )}
                  </View>

                  {/* Text Right */}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ color: "#EAF0FF", fontWeight: "900" }}
                      numberOfLines={1}
                    >
                      {e.name}
                    </Text>

                    <Text
                      style={{ color: "rgba(234,240,255,0.72)", marginTop: 4 }}
                      numberOfLines={1}
                    >
                      {e.place ?? "—"}
                    </Text>

                    <Text
                      style={{
                        color: "#60A5FA",
                        marginTop: 4,
                        fontWeight: "700",
                        fontSize: 12,
                      }}
                      numberOfLines={1}
                    >
                      {new Date(e.startDate).toLocaleString("fr-FR")}
                    </Text>
                  </View>
                </Pressable>
              </Link>
            ))
          )}
        </View>
        {/* Other meditations header */}
        <View
          style={{
            marginTop: 18,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#EAF0FF", fontSize: 18, fontWeight: "800" }}>
            Autres méditations
          </Text>

          <Pressable onPress={() => router.push("/meditation/other-meditations")}>
            <Text style={{ color: "#60A5FA", fontWeight: "800" }}>
              Voir tout
            </Text>
          </Pressable>
        </View>

        <View style={{ marginTop: 12, gap: 10 }}>
          {otherMeditations.length === 0 ? (
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
                Aucune autre méditation disponible.
              </Text>
            </View>
          ) : (
            otherMeditations.map((m) => (
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
                  {/* Image Left */}
                  <View
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 16,
                      overflow: "hidden",
                      backgroundColor: "#0B1220",
                      borderWidth: 1,
                      borderColor: "rgba(234,240,255,0.10)",
                    }}
                  >
                    <Image
                      source={{
                        uri:
                          m.imageUrl ??
                          "https://picsum.photos/seed/medit/900/900",
                      }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  </View>

                  {/* Text Right */}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ color: "#EAF0FF", fontWeight: "900" }}
                      numberOfLines={1}
                    >
                      {m.isPremium ? "🔒 Premium • " : ""}{m.title}
                    </Text>

                    <Text
                      style={{ color: "rgba(234,240,255,0.72)", marginTop: 4 }}
                      numberOfLines={2}
                    >
                      {m.footerText ?? "—"}
                    </Text>

                    <Text
                      style={{
                        color: "rgba(234,240,255,0.55)",
                        marginTop: 4,
                        fontWeight: "800",
                        fontSize: 12,
                      }}
                      numberOfLines={1}
                    >
                      {new Date(m.createdAt).toLocaleDateString("fr-FR")}
                      {m.audioDuration ? ` • ⏱ ${m.audioDuration}` : ""}
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
