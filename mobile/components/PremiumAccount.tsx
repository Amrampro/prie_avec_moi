import React, { useCallback, useState } from "react";
import { Text, View, Pressable } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { apiPremiumStatus, PremiumStatus } from "../services/premium.api";
import { useAuthStore } from "../stores/auth.store";

export function PremiumAccount() {
  const token = useAuthStore((s) => s.token);

  const [status, setStatus] = useState<PremiumStatus | null>(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());

  useFocusEffect(
    useCallback(() => {
      let live = true;

      setStatus(null);
      setError("");

      if (token) {
        apiPremiumStatus()
          .then((value) => {
            if (!live) return;

            setStatus(value);
            setNow(Date.now());

            const current = useAuthStore.getState();

            if (current.user && current.token === token) {
              current.setUser({
                ...current.user,
                ...value,
              });
            }
          })
          .catch((e) => {
            if (live) {
              setError(e.message);
            }
          });
      }

      const timer = setInterval(() => {
        setNow(Date.now());
      }, 1000);

      return () => {
        live = false;
        clearInterval(timer);
      };
    }, [token])
  );

  if (!token) return null;

  const active =
    status?.isPremium &&
    !!status.premiumEndAt &&
    new Date(status.premiumEndAt).getTime() > now;

  return (
    <View
      style={{
        marginTop: 14,
        padding: 16,
        borderRadius: 22,
        backgroundColor: "#0F1A2C",
      }}
    >
      <Text
        style={{
          color: active ? "#FBBF24" : "#EAF0FF",
          fontWeight: "900",
        }}
      >
        {status
          ? active
            ? "Compte Premium"
            : "Compte gratuit"
          : error || "Chargement du statut…"}
      </Text>

      {active && (
        <Text
          style={{
            color: "#EAF0FF",
            marginTop: 6,
          }}
        >
          Valable jusqu’au :{" "}
          {new Date(status!.premiumEndAt!).toLocaleDateString("fr-FR")}
        </Text>
      )}

      <Pressable
        onPress={() => router.push("/settings/premium")}
        style={{
          marginTop: 12,
        }}
      >
        <Text
          style={{
            color: "#60A5FA",
            fontWeight: "800",
          }}
        >
          Voir/Activer les codes premium
        </Text>
      </Pressable>
    </View>
  );
}