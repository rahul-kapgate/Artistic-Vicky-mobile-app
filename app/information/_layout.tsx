import { Stack } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";

const APP_BACKGROUND = "#050A1C";

export default function InformationLayout() {
  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          presentation: "card",
          gestureEnabled: true,
          contentStyle: {
            backgroundColor: APP_BACKGROUND,
          },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_BACKGROUND,
  },
});
