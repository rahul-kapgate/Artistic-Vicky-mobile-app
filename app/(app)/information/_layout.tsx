import { Stack } from "expo-router";
import React from "react";

export default function InformationLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: {
          backgroundColor: "#050A1C",
        },
      }}
    />
  );
}
