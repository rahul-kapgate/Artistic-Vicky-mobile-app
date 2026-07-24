import { Stack } from "expo-router";
import React from "react";

const APP_BACKGROUND = "#050A1C";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: "card",
        animation: "slide_from_right",
        contentStyle: {
          backgroundColor: APP_BACKGROUND,
        },
      }}
    >
      <Stack.Screen name="login" options={{ animation: "fade" }} />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
