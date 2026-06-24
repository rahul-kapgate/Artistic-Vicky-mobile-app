import QueryProvider from "@/providers/QueryProvider";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <QueryProvider>
      <GestureHandlerRootView style={styles.flex}>
        <SafeAreaProvider>
          <View style={styles.flex}>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                animation: "fade",
                contentStyle: {
                  backgroundColor: "#0B0B0B",
                },
              }}
            />
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryProvider>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
