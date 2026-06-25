import { loginUser } from "@/services/auth.service";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../../store/authStore";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const setUser = useAuthStore((state) => state.setUser);

  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useMutation({
    mutationFn: () => loginUser(email, password),

    onSuccess: async (data) => {
      await SecureStore.setItemAsync("accessToken", data.accessToken);

      await SecureStore.setItemAsync("refreshToken", data.refreshToken);

      setUser(data.user);

      router.replace("/home");
    },

    onError: (error: any) => {
      console.log(error);

      alert("Invalid credentials");
    },
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar style="light" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.container}
        >
          <View style={styles.content}>
            <View style={styles.brandContainer}>
              <Text style={styles.brand}>AV Art</Text>
              <Text style={styles.brandAccent}>Academy</Text>
            </View>

            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Log in to continue your creative journey.
            </Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#8A93B8"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor="#8A93B8"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.passwordInput}
              />

              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={22}
                  color="#8A93B8"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.forgotContainer}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <LinearGradient
              colors={["#FF4DA6", "#6A5CFF", "#33D6FF"]}
              style={styles.loginGradient}
            >
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.loginButton}
                onPress={() => loginMutation.mutate()}
                disabled={loginMutation.isPending}
              >
                <Text style={styles.loginButtonText}>
                  {loginMutation.isPending ? "Logging In..." : "Log In"}
                </Text>
              </TouchableOpacity>
            </LinearGradient>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>

            {/* <TouchableOpacity activeOpacity={0.85} style={styles.googleButton}>
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity> */}

            <View style={styles.signupRow}>
              <Text style={styles.signupText}>Don't have an account?</Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push("/(auth)/signup")}
              >
                <Text style={styles.signupLink}> Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#050A1C",
  },
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: "#050A1C",
  },

  content: {
    width: "100%",
    maxWidth: "100%",
    alignSelf: "center",
  },

  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "rgba(111, 66, 193, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(196, 128, 255, 0.4)",
    marginBottom: 22,
  },
  badgeDot: {
    color: "#B47CFF",
    fontSize: 10,
  },
  badgeText: {
    color: "#D8C2FF",
    fontSize: 12,
    fontWeight: "700",
  },

  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 18,
  },
  brand: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },
  brandAccent: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "800",
    color: "#4CC3FF",
    letterSpacing: -0.4,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    color: "#B8C1DB",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },

  label: {
    color: "#B47CFF",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#0F1735",
    borderWidth: 1,
    borderColor: "rgba(139, 148, 200, 0.25)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    color: "#FFFFFF",
    fontSize: 15,
    marginBottom: 16,
  },

  forgotContainer: {
    alignItems: "flex-end",
    marginBottom: 20,
  },
  forgotText: {
    color: "#33D6FF",
    fontSize: 14,
    fontWeight: "700",
  },

  loginGradient: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 18,
  },
  loginButton: {
    paddingVertical: 16,
    alignItems: "center",
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(139, 148, 200, 0.22)",
  },
  dividerText: {
    color: "#AAB2CC",
    fontSize: 13,
    fontWeight: "700",
    marginHorizontal: 12,
  },

  googleButton: {
    borderWidth: 1,
    borderColor: "rgba(79, 139, 255, 0.35)",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    backgroundColor: "rgba(18, 27, 59, 0.9)",
    marginBottom: 18,
  },
  googleButtonText: {
    color: "#EAF0FF",
    fontSize: 15,
    fontWeight: "700",
  },

  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
  },
  signupText: {
    color: "#B8C1DB",
    fontSize: 14,
  },
  signupLink: {
    color: "#33D6FF",
    fontSize: 14,
    fontWeight: "800",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F1735",
    borderWidth: 1,
    borderColor: "rgba(139, 148, 200, 0.25)",
    borderRadius: 14,
    marginBottom: 16,
  },

  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 15,
    color: "#FFFFFF",
    fontSize: 15,
  },

  eyeButton: {
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
  },
});
