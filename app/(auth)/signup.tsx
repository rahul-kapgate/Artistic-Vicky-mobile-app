import { initiateSignup, verifySignupOtp } from "@/services/auth.service";
import { useMutation } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

export default function SignupScreen() {
  const [step, setStep] = useState<"register" | "otp">("register");

  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [otp, setOtp] = useState("");

  const signupMutation = useMutation({
    mutationFn: () =>
      initiateSignup({
        user_name: userName,
        email,
        mobile,
        password,
      }),

    onSuccess: () => {
      setStep("otp");

      Alert.alert("Success", "OTP sent to your email");
    },

    onError: (error: any) => {
      console.log(error);

      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to send OTP",
      );
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: () => verifySignupOtp(email, otp),

    onSuccess: () => {
      Alert.alert(
        "Account Created 🎉",
        "Your account has been created successfully.",
        [
          {
            text: "Login",
            onPress: () => router.replace("/(auth)/login"),
          },
        ],
      );
    },

    onError: (error: any) => {
      console.log(error);

      Alert.alert("Error", error?.response?.data?.message || "Invalid OTP");
    },
  });

  const handleSignup = () => {
    if (!userName || !email || !mobile || !password || !confirmPassword) {
      Alert.alert("Validation Error", "Please fill all fields");

      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Validation Error", "Passwords do not match");

      return;
    }

    signupMutation.mutate();
  };

  if (step === "otp") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Verify OTP</Text>

          <Text style={styles.subtitle}>We sent a verification code to</Text>

          <Text style={styles.email}>{email}</Text>

          <TextInput
            value={otp}
            onChangeText={setOtp}
            placeholder="Enter 6 Digit OTP"
            placeholderTextColor="#8A93B8"
            keyboardType="number-pad"
            maxLength={6}
            style={styles.input}
          />

          <LinearGradient
            colors={["#FF4DA6", "#6A5CFF", "#33D6FF"]}
            style={styles.buttonGradient}
          >
            <TouchableOpacity
              style={styles.button}
              onPress={() => verifyOtpMutation.mutate()}
              disabled={verifyOtpMutation.isPending}
            >
              {verifyOtpMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify OTP</Text>
              )}
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.brand}>AV Art</Text>

          <Text style={styles.brandAccent}>Academy</Text>

          <Text style={styles.title}>Create Account</Text>

          <Text style={styles.label}>Full Name</Text>

          <TextInput
            value={userName}
            onChangeText={setUserName}
            placeholder="Enter full name"
            placeholderTextColor="#8A93B8"
            style={styles.input}
          />

          <Text style={styles.label}>Email</Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Enter email"
            placeholderTextColor="#8A93B8"
            style={styles.input}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Mobile Number</Text>

          <TextInput
            value={mobile}
            onChangeText={setMobile}
            placeholder="Enter mobile number"
            placeholderTextColor="#8A93B8"
            keyboardType="phone-pad"
            style={styles.input}
          />

          <Text style={styles.label}>Password</Text>

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            placeholderTextColor="#8A93B8"
            secureTextEntry
            style={styles.input}
          />

          <Text style={styles.label}>Confirm Password</Text>

          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm password"
            placeholderTextColor="#8A93B8"
            secureTextEntry
            style={styles.input}
          />

          <LinearGradient
            colors={["#FF4DA6", "#6A5CFF", "#33D6FF"]}
            style={styles.buttonGradient}
          >
            <TouchableOpacity
              style={styles.button}
              onPress={handleSignup}
              disabled={signupMutation.isPending}
            >
              {signupMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Continue</Text>
              )}
            </TouchableOpacity>
          </LinearGradient>

          <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
            <Text style={styles.loginLink}>Already have an account? Login</Text>
          </TouchableOpacity>
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

  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },

  brand: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "800",
  },

  brandAccent: {
    color: "#4CC3FF",
    fontSize: 34,
    fontWeight: "800",
    marginBottom: 24,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
  },

  subtitle: {
    color: "#B8C1DB",
    marginBottom: 8,
  },

  email: {
    color: "#4CC3FF",
    marginBottom: 24,
  },

  label: {
    color: "#B47CFF",
    marginBottom: 8,
    fontWeight: "700",
  },

  input: {
    backgroundColor: "#0F1735",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(139,148,200,0.25)",
    padding: 16,
    color: "#fff",
    marginBottom: 16,
  },

  buttonGradient: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 10,
  },

  button: {
    paddingVertical: 16,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  loginLink: {
    color: "#33D6FF",
    textAlign: "center",
    marginTop: 20,
    fontWeight: "600",
  },
});
