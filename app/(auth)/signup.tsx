import { initiateSignup, verifySignupOtp } from "@/services/auth.service";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
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

type SignupPayload = {
  user_name: string;
  email: string;
  mobile: string;
  password: string;
};

export default function SignupScreen() {
  const [step, setStep] = useState<"register" | "otp">("register");

  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [otp, setOtp] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const signupMutation = useMutation({
    mutationFn: (payload: SignupPayload) => initiateSignup(payload),

    onSuccess: () => {
      setStep("otp");
      Alert.alert("Success", "OTP sent to your email.");
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
    mutationFn: () => verifySignupOtp(email.trim().toLowerCase(), otp),

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

  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  };

  const handleSignup = () => {
    const trimmedName = userName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedMobile = mobile.trim();

    if (
      !trimmedName ||
      !trimmedEmail ||
      !trimmedMobile ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert("Validation Error", "Please fill all fields.");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      Alert.alert("Validation Error", "Please enter a valid email address.");
      return;
    }

    if (trimmedMobile.length < 10) {
      Alert.alert("Validation Error", "Please enter a valid mobile number.");
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Validation Error",
        "Password should be at least 6 characters long.",
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Validation Error", "Passwords do not match.");
      return;
    }

    setEmail(trimmedEmail);

    signupMutation.mutate({
      user_name: trimmedName,
      email: trimmedEmail,
      mobile: trimmedMobile,
      password,
    });
  };

  const handleVerifyOtp = () => {
    if (otp.length !== 6) {
      Alert.alert("Validation Error", "Please enter a valid 6 digit OTP.");
      return;
    }

    verifyOtpMutation.mutate();
  };

  const handleResendOtp = () => {
    if (signupMutation.isPending) return;

    signupMutation.mutate({
      user_name: userName.trim(),
      email: email.trim().toLowerCase(),
      mobile: mobile.trim(),
      password,
    });
  };

  if (step === "otp") {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <StatusBar style="light" />

        <View style={styles.glowTopLeft} />
        <View style={styles.glowCenter} />
        <View style={styles.glowBottomRight} />

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.backButton}
                onPress={() => setStep("register")}
              >
                <Ionicons name="arrow-back" size={20} color="#EAF0FF" />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>

              <View style={styles.otpIconWrapper}>
                <LinearGradient
                  colors={["#FF3FA7", "#7C3AED", "#33D6FF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.otpIconGradient}
                >
                  <Ionicons name="mail-unread-outline" size={34} color="#fff" />
                </LinearGradient>
              </View>

              <Text style={styles.title}>Verify OTP</Text>

              <Text style={styles.subtitle}>
                We sent a 6 digit verification code to your email.
              </Text>

              <Text style={styles.emailText}>{email}</Text>

              <TextInput
                value={otp}
                onChangeText={(value) => setOtp(value.replace(/\D/g, ""))}
                placeholder="Enter 6 Digit OTP"
                placeholderTextColor="#8A93B8"
                keyboardType="number-pad"
                maxLength={6}
                style={[styles.input, styles.otpInput]}
              />

              <LinearGradient
                colors={
                  verifyOtpMutation.isPending
                    ? ["#334155", "#475569"]
                    : ["#FF3FA7", "#7C3AED", "#33D6FF"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.buttonGradient,
                  verifyOtpMutation.isPending && styles.buttonGradientDisabled,
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.button}
                  onPress={handleVerifyOtp}
                  disabled={verifyOtpMutation.isPending}
                >
                  {verifyOtpMutation.isPending ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text style={styles.buttonText}>Verifying...</Text>
                    </View>
                  ) : (
                    <Text style={styles.buttonText}>Verify Account</Text>
                  )}
                </TouchableOpacity>
              </LinearGradient>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleResendOtp}
                disabled={signupMutation.isPending}
              >
                <Text style={styles.resendText}>
                  {signupMutation.isPending
                    ? "Sending OTP..."
                    : "Didn't receive OTP? Resend"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar style="light" />

      <View style={styles.glowTopLeft} />
      <View style={styles.glowCenter} />
      <View style={styles.glowBottomRight} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.brandContainer}>
              <Text style={styles.brand}>AVArt</Text>
              <Text style={styles.brandAccent}>Academy</Text>
            </View>

            <Text style={styles.title}>Create Account</Text>

            <Text style={styles.subtitle}>
              Join AV Art Academy and start your creative learning journey.
            </Text>

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
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />

            <Text style={styles.label}>Mobile Number</Text>
            <TextInput
              value={mobile}
              onChangeText={(value) => setMobile(value.replace(/\D/g, ""))}
              placeholder="Enter mobile number"
              placeholderTextColor="#8A93B8"
              keyboardType="phone-pad"
              maxLength={10}
              style={styles.input}
            />

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                placeholderTextColor="#8A93B8"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.passwordInput}
              />

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowPassword((prev) => !prev)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={22}
                  color="#8A93B8"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm password"
                placeholderTextColor="#8A93B8"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.passwordInput}
              />

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowConfirmPassword((prev) => !prev)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                  size={22}
                  color="#8A93B8"
                />
              </TouchableOpacity>
            </View>

            <LinearGradient
              colors={
                signupMutation.isPending
                  ? ["#334155", "#475569"]
                  : ["#FF3FA7", "#7C3AED", "#33D6FF"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.buttonGradient,
                signupMutation.isPending && styles.buttonGradientDisabled,
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.button}
                onPress={handleSignup}
                disabled={signupMutation.isPending}
              >
                {signupMutation.isPending ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.buttonText}>Sending OTP...</Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>Create Account</Text>
                )}
              </TouchableOpacity>
            </LinearGradient>

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account?</Text>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.replace("/(auth)/login")}
              >
                <Text style={styles.loginLink}> Login</Text>
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
    paddingVertical: 28,
  },

  content: {
    width: "100%",
    alignSelf: "center",
  },

  glowTopLeft: {
    position: "absolute",
    top: -90,
    left: -110,
    width: 260,
    height: 260,
    borderRadius: 260,
    backgroundColor: "rgba(255, 63, 167, 0.15)",
  },

  glowCenter: {
    position: "absolute",
    top: 220,
    right: -70,
    width: 230,
    height: 230,
    borderRadius: 230,
    backgroundColor: "rgba(124, 58, 237, 0.17)",
  },

  glowBottomRight: {
    position: "absolute",
    bottom: -120,
    right: -120,
    width: 320,
    height: 320,
    borderRadius: 320,
    backgroundColor: "rgba(51, 214, 255, 0.12)",
  },

  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 14,
  },

  brand: {
    color: "#FFFFFF",
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  brandAccent: {
    color: "#4CC3FF",
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 8,
    letterSpacing: -0.4,
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
    marginBottom: 8,
    fontWeight: "800",
  },

  input: {
    backgroundColor: "#0F1735",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(139,148,200,0.25)",
    paddingHorizontal: 16,
    paddingVertical: 15,
    color: "#FFFFFF",
    fontSize: 15,
    marginBottom: 16,
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F1735",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(139,148,200,0.25)",
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
    alignItems: "center",
    justifyContent: "center",
  },

  buttonGradient: {
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 8,
    marginBottom: 18,
    shadowColor: "#33D6FF",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 10,
  },

  buttonGradientDisabled: {
    shadowOpacity: 0.12,
    elevation: 3,
  },

  button: {
    minHeight: 58,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 0.4,
  },

  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
  },

  loginText: {
    color: "#B8C1DB",
    fontSize: 14,
  },

  loginLink: {
    color: "#33D6FF",
    fontSize: 14,
    fontWeight: "900",
  },

  backButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 28,
    paddingVertical: 8,
    paddingRight: 12,
  },

  backButtonText: {
    color: "#EAF0FF",
    fontSize: 15,
    fontWeight: "700",
  },

  otpIconWrapper: {
    alignItems: "center",
    marginBottom: 22,
  },

  otpIconGradient: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#33D6FF",
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 8,
  },

  emailText: {
    color: "#33D6FF",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 22,
  },

  otpInput: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 8,
  },

  resendText: {
    color: "#33D6FF",
    textAlign: "center",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4,
  },
});
