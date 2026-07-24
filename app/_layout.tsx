import AppAlertProvider from "@/components/ui/AppAlertProvider";
import "@/lib/googleSignIn";
import QueryProvider from "@/providers/QueryProvider";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

const APP_BACKGROUND = "#050A1C";

export default function RootLayout() {
  return (
    <QueryProvider>
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <AppAlertProvider>
            <View style={styles.root}>
              <StatusBar style="light" backgroundColor={APP_BACKGROUND} />

              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: "fade",
                  presentation: "card",
                  contentStyle: {
                    backgroundColor: APP_BACKGROUND,
                  },
                }}
              >
                {/* Public screens */}
                <Stack.Screen
                  name="index"
                  options={{
                    contentStyle: {
                      backgroundColor: APP_BACKGROUND,
                    },
                  }}
                />

                <Stack.Screen
                  name="landing"
                  options={{
                    animation: "fade",
                    contentStyle: {
                      backgroundColor: APP_BACKGROUND,
                    },
                  }}
                />

                <Stack.Screen
                  name="courses"
                  options={{
                    animation: "slide_from_right",
                    contentStyle: {
                      backgroundColor: APP_BACKGROUND,
                    },
                  }}
                />

                <Stack.Screen
                  name="course/[id]"
                  options={{
                    animation: "slide_from_right",
                    contentStyle: {
                      backgroundColor: APP_BACKGROUND,
                    },
                  }}
                />

                {/* Public information screens */}
                <Stack.Screen
                  name="information"
                  options={{
                    animation: "slide_from_right",
                    presentation: "card",
                    contentStyle: {
                      backgroundColor: APP_BACKGROUND,
                    },
                  }}
                />

                {/* Authentication */}
                <Stack.Screen
                  name="(auth)"
                  options={{
                    animation: "fade",
                    contentStyle: {
                      backgroundColor: APP_BACKGROUND,
                    },
                  }}
                />

                {/* Protected app */}
                <Stack.Screen
                  name="(app)"
                  options={{
                    animation: "fade",
                    contentStyle: {
                      backgroundColor: APP_BACKGROUND,
                    },
                  }}
                />
              </Stack>
            </View>
          </AppAlertProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: APP_BACKGROUND,
  },
});
