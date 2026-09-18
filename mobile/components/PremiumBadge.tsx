import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type PremiumAccount = {
  isPremium?: boolean;
  premiumEndAt?: string | null;
};

export function PremiumBadge({ account, size = 18 }: {
  account?: PremiumAccount | null;
  size?: number;
}) {
  const active = account?.isPremium &&
    !!account.premiumEndAt &&
    new Date(account.premiumEndAt).getTime() > Date.now();

  if (!active) return null;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Compte Premium"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#FBBF24",
        borderWidth: 1,
        borderColor: "#FCD34D",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Ionicons name="checkmark" size={size - 6} color="#422006" />
    </View>
  );
}
