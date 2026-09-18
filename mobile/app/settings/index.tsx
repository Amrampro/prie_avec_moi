import { PremiumBadge } from "../../components/PremiumBadge";
// app/(tabs)/settings.tsx
import { PremiumAccount } from "../../components/PremiumAccount";
import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Alert,
  Linking,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../stores/auth.store";

function Row({
  icon,
  label,
  sub,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 16,
          backgroundColor: "#0B1220",
          borderWidth: 1,
          borderColor: "rgba(234,240,255,0.10)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={20} color="#EAF0FF" />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>{label}</Text>
        {!!sub && (
          <Text
            style={{ color: "rgba(234,240,255,0.72)", marginTop: 2 }}
            numberOfLines={1}
          >
            {sub}
          </Text>
        )}
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color="rgba(234,240,255,0.55)"
      />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  const avatarUri = useMemo(
    () =>
      user?.avatarUrl ??
      "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    [user],
  );

  const isConnected = Boolean(user);
  const fullName = user?.fullName ?? "User not connected";
  const email = user?.email ?? "—";
  const isAdmin = !!user?.isAdmin;

  async function contactDeveloper() {
    const to = "goulbam8@gmail.com";
    const subject = encodeURIComponent(
      "Prie avec moi — Support / Signalement de bug",
    );
    const body = encodeURIComponent(
      `Bonjour,\n\nJe rencontre un problème sur l'application "Prie avec moi".\n\n` +
        `Description du problème :\n- \n\n` +
        `Étapes pour reproduire :\n1) \n2) \n\n` +
        `Appareil / OS :\n- \n\nMerci.`,
    );

    const mailto = `mailto:${to}?subject=${subject}&body=${body}`;

    const can = await Linking.canOpenURL(mailto);
    if (!can) {
      Alert.alert(
        "Erreur",
        "Impossible d'ouvrir l'application Mail sur cet appareil.",
      );
      return;
    }
    await Linking.openURL(mailto);
  }

  return (
    <View
      style={{ flex: 1, backgroundColor: "#0B1220", paddingTop: insets.top }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <Text style={{ color: "#EAF0FF", fontSize: 22, fontWeight: "900" }}>
          Paramètres
        </Text>
        <Text
          style={{
            color: "rgba(234,240,255,0.72)",
            marginTop: 6,
            display: isConnected ? "flex" : "none",
          }}
        >
          Gère ton compte et tes préférences.
        </Text>

        {/* Profile card */}
        <Pressable
          onPress={() => router.push("/settings/edit")}
          style={{
            display: isConnected ? "flex" : "none",
            marginTop: 14,
            padding: 14,
            borderRadius: 22,
            backgroundColor: "#0F1A2C",
            borderWidth: 1,
            borderColor: "rgba(234,240,255,0.10)",
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Image
            source={{ uri: avatarUri }}
            style={{
              width: 54,
              height: 54,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: "rgba(234,240,255,0.12)",
            }}
          />
          <View style={{ flex: 1 }}>
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

            <Text
              style={{ color: "rgba(234,240,255,0.72)", marginTop: 4 }}
              numberOfLines={1}
            >
              {email}
            </Text>
          </View>

          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: isAdmin
                ? "rgba(37,99,235,0.15)"
                : "rgba(234,240,255,0.06)",
              borderWidth: 1,
              borderColor: "rgba(234,240,255,0.10)",
            }}
          >
            <Text style={{ color: "#EAF0FF", fontWeight: "900", fontSize: 12 }}>
              {isAdmin ? "Admin" : "Utilisateur"}
            </Text>
          </View>
        </Pressable>

        {/* Account type */}
        <View
          style={{
            display: isConnected ? "flex" : "none",
            marginTop: 14,
            padding: 14,
            borderRadius: 22,
            backgroundColor: "#0F1A2C",
            borderWidth: 1,
            borderColor: "rgba(234,240,255,0.10)",
          }}
        >
          <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
            Type de compte
          </Text>

          <PremiumAccount />
          {isAdmin && (
            <Row
              icon="key-outline"
              label="Codes Premium"
              sub="Créer et gérer les codes d’activation"
              onPress={() => router.push("/settings/admin/premium-codes")}
            />
          )}
        </View>

        {/* User section */}
        <View
          style={{
            display: isConnected ? "flex" : "none",
            marginTop: 14,
            padding: 14,
            borderRadius: 22,
            backgroundColor: "#0F1A2C",
            borderWidth: 1,
            borderColor: "rgba(234,240,255,0.10)",
          }}
        >
          <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>Compte</Text>

          <View style={{ marginTop: 10 }}>
            <Row
              icon="person-circle-outline"
              label="Modifier mon profil"
              sub="Nom, photo, informations"
              onPress={() => router.push("/settings/edit")}
            />
            {/* Just remove here to allow any user post. It is already programmed as to allow users post here */}
            {isAdmin && (
              <Row
                icon="newspaper-outline"
                label="Mes publications"
                sub="Créer, modifier, publier"
                onPress={() => router.push("/settings/posts")}
              />
            )}
          </View>
        </View>

        {/* Admin section (only if admin) */}
        {isAdmin && (
          <View
            style={{
              marginTop: 14,
              padding: 14,
              borderRadius: 22,
              backgroundColor: "#0F1A2C",
              borderWidth: 1,
              borderColor: "rgba(234,240,255,0.10)",
            }}
          >
            <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
              Administration
            </Text>
            <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 6 }}>
              Gère le contenu publié dans l’application.
            </Text>

            <View style={{ marginTop: 10 }}>
              <Row
                icon="library-outline"
                label="Gérer les séries"
                sub="Créer, publier, modifier"
                onPress={() => router.push("/settings/admin/series")}
              />
              <Row
                icon="book-outline"
                label="Gérer les méditations"
                sub="Créer, publier, modifier"
                onPress={() => router.push("/settings/admin/meditations")}
              />
              <Row
                icon="calendar-outline"
                label="Gérer les évènements"
                sub="Créer, publier, modifier"
                onPress={() => router.push("/settings/admin/events")}
              />
              <Row
                icon="newspaper-outline"
                label="Gérer les actualités"
                sub="Créer, publier, modifier"
                onPress={() => router.push("/settings/admin/posts")}
              />
              <Row
                icon="people-outline"
                label="Gérer les utilisateurs"
                sub="Créer, modifier, supprimer"
                onPress={() => router.push("/settings/admin/users")}
              />
            </View>
          </View>
        )}

        {!isConnected && (
          <View
            style={{
              marginTop: 14,
              padding: 14,
              borderRadius: 22,
              backgroundColor: "#0F1A2C",
              borderWidth: 1,
              borderColor: "rgba(234,240,255,0.10)",
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 16,
                  backgroundColor: "#0B1220",
                  borderWidth: 1,
                  borderColor: "rgba(234,240,255,0.10)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="person-circle-outline"
                  size={22}
                  color="#EAF0FF"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
                  Connecte-toi à ton compte
                </Text>
                <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 4 }}>
                  Pour accéder aux informations de ton profil, tu dois être
                  connecté.
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => router.push("/sign-in")}
              style={{
                marginTop: 12,
                paddingVertical: 12,
                borderRadius: 16,
                backgroundColor: "#2563EB",
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Ionicons name="log-in-outline" size={18} color="#EAF0FF" />
              <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
                Se connecter
              </Text>
            </Pressable>
          </View>
        )}

        {/* Support & Legal */}
        <View
          style={{
            marginTop: 14,
            padding: 14,
            borderRadius: 22,
            backgroundColor: "#0F1A2C",
            borderWidth: 1,
            borderColor: "rgba(234,240,255,0.10)",
          }}
        >
          <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
            Support & Légal
          </Text>

          <View style={{ marginTop: 10 }}>
            <Row
              icon="mail-outline"
              label="Contacter le développeur / Signaler un bug"
              sub="Ouvre un email vers goulbam8@gmail.com"
              onPress={contactDeveloper}
            />
            <Row
              icon="document-text-outline"
              label="Termes & conditions"
              sub="RGPD, consentements, utilisation"
              onPress={() => router.push("/settings/terms")}
            />
          </View>
        </View>

        {/* Logout */}
        <Pressable
          onPress={async () => {
            await signOut();
            router.replace("/(tabs)");
          }}
          style={{
            display: isConnected ? "flex" : "none",
            marginTop: 14,
            paddingVertical: 14,
            borderRadius: 22,
            backgroundColor: "#0F1A2C",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.10)",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <Ionicons name="log-out-outline" size={18} color="#EAF0FF" />
          <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
            Déconnexion
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
