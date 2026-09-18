import React from "react";
import { View, Text, TextInput } from "react-native";

export function AdminField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={{ color: "rgba(234,240,255,0.72)", fontWeight: "800", marginBottom: 8 }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(234,240,255,0.35)"
        multiline={multiline}
        style={{
          borderRadius: 18,
          paddingHorizontal: 14,
          paddingVertical: 12,
          minHeight: multiline ? 120 : undefined,
          textAlignVertical: multiline ? "top" : "auto",
          backgroundColor: "#0F1A2C",
          borderWidth: 1,
          borderColor: "rgba(234,240,255,0.10)",
          color: "#EAF0FF",
          fontWeight: "700",
        }}
      />
    </View>
  );
}
