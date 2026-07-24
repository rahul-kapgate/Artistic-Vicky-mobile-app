import { useAppAlert } from "@/components/ui/AppAlertProvider";
import { loginUser } from "@/services/auth.service";
import { useAuthStore } from "@/store/authStore";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type RedirectTarget = "home" | "course-detail" | "course-dashboard";

function getSingleParam(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function LoginScreen() {
  const { alert } = useAppAlert();
  const router = useRouter();

  const params = useLocalSearchParams<{
    redirectTo?: string | string[];
    courseId?: string | string[];
  }>();

  const redirectTo = getSingleParam(params.redirectTo) as
    | RedirectTarget
    | undefined;

  const courseId = getSingleParam(params.courseId);

  const setUser = useAuthStore((state) => state.setUser);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const redirectAfterLogin = () => {
    if (redirectTo === "course-dashboard" && courseId) {
      router.replace({
        pathname: "/(app)/course/dashboard",
        params: {
          id: courseId,
        },
      });

      return;
    }

    if (redirectTo === "course-detail" && courseId) {
      router.replace({
        pathname: "/course/[id]",
        params: {
          id: courseId,
        },
      });

      return;
    }

    router.replace("/(app)/home");
  };

  const loginMutation = useMutation({
    mutationFn: () => loginUser(email.trim().toLowerCase(), password),

    onSuccess: async (data) => {
      try {
        await Promise.all([
          SecureStore.setItemAsync("accessToken", data.accessToken),
          SecureStore.setItemAsync("refreshToken", data.refreshToken),
        ]);

        setUser(data.user);
        redirectAfterLogin();
      } catch (error) {
        console.error("Unable to save login session:", error);

        alert(
          "Session Could Not Be Saved",
          "You logged in successfully, but your session could not be stored securely on this device.",
          [
            {
              text: "Try Again",
              style: "default",
              onPress: () => {
                loginMutation.mutate();
              },
            },
            {
              text: "Close",
              style: "cancel",
            },
          ],
          {
            tone: "danger",
            icon: "shield-outline",
            cancelable: true,
          },
        );
      }
    },

    onError: (error: any) => {
      console.error("Login failed:", error);

      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Invalid email or password.";

      alert(
        "Login Failed",
        errorMessage,
        [
          {
            text: "Try Again",
            style: "default",
          },
        ],
        {
          tone: "danger",
          icon: "lock-closed-outline",
          cancelable: true,
        },
      );
    },
  });

  const handleLogin = () => {
    if (loginMutation.isPending) {
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail && !password) {
      alert(
        "Email and Password Required",
        "Please enter your email address and password to continue.",
        [
          {
            text: "Got It",
            style: "default",
          },
        ],
        {
          tone: "warning",
          icon: "create-outline",
          cancelable: true,
        },
      );

      return;
    }

    if (!trimmedEmail) {
      alert(
        "Email Required",
        "Please enter the email address associated with your account.",
        [
          {
            text: "Got It",
            style: "default",
          },
        ],
        {
          tone: "warning",
          icon: "mail-outline",
          cancelable: true,
        },
      );

      return;
    }

    if (!password) {
      alert(
        "Password Required",
        "Please enter your account password to continue.",
        [
          {
            text: "Got It",
            style: "default",
          },
        ],
        {
          tone: "warning",
          icon: "lock-closed-outline",
          cancelable: true,
        },
      );

      return;
    }

    loginMutation.mutate();
  };

  const handleSignup = () => {
    router.push({
      pathname: "/(auth)/signup",
      params: {
        ...(redirectTo ? { redirectTo } : {}),
        ...(courseId ? { courseId } : {}),
      },
    });
  };

  const handleBack = () => {
    if (courseId) {
      router.replace({
        pathname: "/course/[id]",
        params: {
          id: courseId,
        },
      });

      return;
    }

    router.back();
  };

  const handleForgotPassword = () => {
    alert(
      "Forgot Password?",
      "Password reset is not available inside the app yet. Please contact AV Art Academy support for help accessing your account.",
      [
        {
          text: "Contact Support",
          style: "default",
          onPress: () => {
            router.push("/information/contact-us");
          },
        },
        {
          text: "Not Now",
          style: "cancel",
        },
      ],
      {
        tone: "info",
        icon: "key-outline",
        cancelable: true,
      },
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar style="light" />

      <LinearGradient
        colors={["#050A1C", "#07112B", "#110A2A"]}
        locations={[0, 0.58, 1]}
        style={styles.flex}
      >
        <View style={styles.glowTopLeft} />
        <View style={styles.glowTopRight} />
        <View style={styles.glowBottom} />

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
              <View style={styles.topBar}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  hitSlop={10}
                  style={styles.backButton}
                  onPress={handleBack}
                >
                  <Ionicons name="arrow-back" size={21} color="#FFFFFF" />
                </TouchableOpacity>

                <View style={styles.secureBadge}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={14}
                    color="#86EFAC"
                  />

                  <Text style={styles.secureBadgeText}>Secure Login</Text>
                </View>
              </View>

              <View style={styles.brandSection}>
                <LinearGradient
                  colors={["#FF3FA7", "#7C3AED", "#33D6FF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.logoGradient}
                >
                  <View style={styles.logoInner}>
                    <Ionicons
                      name="color-palette-outline"
                      size={31}
                      color="#FFFFFF"
                    />
                  </View>
                </LinearGradient>

                <View style={styles.brandTextContainer}>
                  <View style={styles.brandRow}>
                    <Text style={styles.brand}>AV Art</Text>

                    <Text style={styles.brandAccent}>Academy</Text>
                  </View>

                  <Text style={styles.brandTagline}>
                    Learn. Create. Succeed.
                  </Text>
                </View>
              </View>

              <Text style={styles.title}>Welcome back</Text>

              <Text style={styles.subtitle}>
                {courseId
                  ? "Sign in to continue with your selected course."
                  : "Sign in to continue your creative learning journey."}
              </Text>

              {courseId && (
                <View style={styles.courseContextCard}>
                  <View style={styles.courseContextIcon}>
                    <Ionicons name="book-outline" size={21} color="#4CC3FF" />
                  </View>

                  <View style={styles.courseContextContent}>
                    <Text style={styles.courseContextTitle}>
                      Your course is waiting
                    </Text>

                    <Text style={styles.courseContextDescription}>
                      After login, you will return to your selected course.
                    </Text>
                  </View>

                  <Ionicons name="checkmark-circle" size={21} color="#22C55E" />
                </View>
              )}

              <View style={styles.formCard}>
                <View style={styles.formHeader}>
                  <Text style={styles.formTitle}>Sign in to your account</Text>

                  <Text style={styles.formDescription}>
                    Enter the credentials used when creating your account.
                  </Text>
                </View>

                <Text style={styles.label}>Email address</Text>

                <View style={styles.inputContainer}>
                  <View style={styles.inputIcon}>
                    <Ionicons name="mail-outline" size={20} color="#8290AF" />
                  </View>

                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor="#65708D"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    editable={!loginMutation.isPending}
                    returnKeyType="next"
                    style={styles.input}
                  />
                </View>

                <View style={styles.passwordLabelRow}>
                  <Text style={styles.label}>Password</Text>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleForgotPassword}
                  >
                    <Text style={styles.forgotText}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                  <View style={styles.inputIcon}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#8290AF"
                    />
                  </View>

                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor="#65708D"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="password"
                    editable={!loginMutation.isPending}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    style={styles.input}
                  />

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setShowPassword((current) => !current)}
                    style={styles.eyeButton}
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={21}
                      color="#8290AF"
                    />
                  </TouchableOpacity>
                </View>

                <LinearGradient
                  colors={
                    loginMutation.isPending
                      ? ["#334155", "#475569"]
                      : ["#FF3FA7", "#7C3AED", "#33D6FF"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.loginGradient,
                    loginMutation.isPending && styles.loginGradientDisabled,
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.loginButton}
                    onPress={handleLogin}
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <View style={styles.loadingRow}>
                        <ActivityIndicator size="small" color="#FFFFFF" />

                        <Text style={styles.loginButtonText}>
                          Signing In...
                        </Text>
                      </View>
                    ) : (
                      <>
                        <Text style={styles.loginButtonText}>Sign In</Text>

                        <View style={styles.buttonArrowContainer}>
                          <Ionicons
                            name="arrow-forward"
                            size={19}
                            color="#FFFFFF"
                          />
                        </View>
                      </>
                    )}
                  </TouchableOpacity>
                </LinearGradient>

                <View style={styles.dividerRow}>
                  <View style={styles.divider} />

                  <Text style={styles.dividerText}>NEW TO AV ART?</Text>

                  <View style={styles.divider} />
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.signupButton}
                  onPress={handleSignup}
                >
                  <View style={styles.signupIcon}>
                    <Ionicons
                      name="person-add-outline"
                      size={20}
                      color="#4CC3FF"
                    />
                  </View>

                  <View style={styles.signupButtonContent}>
                    <Text style={styles.signupButtonTitle}>
                      Create a new account
                    </Text>

                    <Text style={styles.signupButtonDescription}>
                      Join and start learning today
                    </Text>
                  </View>

                  <Ionicons name="chevron-forward" size={21} color="#8290AF" />
                </TouchableOpacity>
              </View>

              <View style={styles.trustRow}>
                <View style={styles.trustItem}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={15}
                    color="#86EFAC"
                  />

                  <Text style={styles.trustText}>Secure</Text>
                </View>

                <View style={styles.trustDot} />

                <View style={styles.trustItem}>
                  <Ionicons name="flash-outline" size={15} color="#FACC15" />

                  <Text style={styles.trustText}>Quick access</Text>
                </View>

                <View style={styles.trustDot} />

                <View style={styles.trustItem}>
                  <Ionicons name="school-outline" size={15} color="#4CC3FF" />

                  <Text style={styles.trustText}>Learn anywhere</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
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

  glowTopLeft: {
    position: "absolute",
    top: -120,
    left: -140,
    width: 320,
    height: 320,
    borderRadius: 320,
    backgroundColor: "rgba(168,85,247,0.2)",
  },

  glowTopRight: {
    position: "absolute",
    top: 80,
    right: -150,
    width: 310,
    height: 310,
    borderRadius: 310,
    backgroundColor: "rgba(51,214,255,0.13)",
  },

  glowBottom: {
    position: "absolute",
    bottom: -160,
    left: -110,
    width: 350,
    height: 350,
    borderRadius: 350,
    backgroundColor: "rgba(255,63,167,0.09)",
  },

  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 22,
  },

  content: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },

  topBar: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 25,
  },

  backButton: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  secureBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.2)",
    backgroundColor: "rgba(34,197,94,0.08)",
  },

  secureBadgeText: {
    color: "#BBF7D0",
    fontSize: 10,
    fontWeight: "800",
    marginLeft: 6,
  },

  brandSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },

  logoGradient: {
    width: 61,
    height: 61,
    borderRadius: 20,
    padding: 2,
  },

  logoInner: {
    flex: 1,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111936",
  },

  brandTextContainer: {
    marginLeft: 13,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  brand: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },

  brandAccent: {
    color: "#4CC3FF",
    fontSize: 20,
    fontWeight: "900",
    marginLeft: 5,
  },

  brandTagline: {
    color: "#7F8AA6",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 34,
    lineHeight: 41,
    fontWeight: "900",
    letterSpacing: -0.8,
  },

  subtitle: {
    color: "#AAB4CC",
    fontSize: 15,
    lineHeight: 23,
    marginTop: 10,
    marginBottom: 22,
  },

  courseContextCard: {
    minHeight: 76,
    borderRadius: 18,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(76,195,255,0.18)",
    backgroundColor: "rgba(37,99,235,0.1)",
    marginBottom: 18,
  },

  courseContextIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(76,195,255,0.1)",
  },

  courseContextContent: {
    flex: 1,
    paddingHorizontal: 12,
  },

  courseContextTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  courseContextDescription: {
    color: "#97A4BF",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 3,
  },

  formCard: {
    borderRadius: 26,
    padding: 19,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(12,20,48,0.92)",
  },

  formHeader: {
    marginBottom: 22,
  },

  formTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "900",
  },

  formDescription: {
    color: "#8793AE",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },

  label: {
    color: "#DCE4F5",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 8,
  },

  passwordLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  forgotText: {
    color: "#4CC3FF",
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 8,
  },

  inputContainer: {
    height: 56,
    width: "100%",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(139,148,200,0.2)",
    backgroundColor: "#09122E",
    marginBottom: 17,
    overflow: "hidden",
  },

  inputIcon: {
    width: 48,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },

  input: {
    flex: 1,
    height: 56,
    color: "#FFFFFF",
    fontSize: 14,
    paddingHorizontal: 0,
    paddingVertical: 0,
    textAlignVertical: "center",
  },

  eyeButton: {
    width: 48,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },

  loginGradient: {
    borderRadius: 17,
    overflow: "hidden",
    marginTop: 5,
    shadowColor: "#33D6FF",
    shadowOpacity: 0.28,
    shadowRadius: 15,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    elevation: 8,
  },

  loginGradientDisabled: {
    shadowOpacity: 0.1,
    elevation: 2,
  },

  loginButton: {
    minHeight: 57,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  buttonArrowContainer: {
    position: "absolute",
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 21,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  dividerText: {
    color: "#68748F",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginHorizontal: 10,
  },

  signupButton: {
    minHeight: 70,
    borderRadius: 17,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(76,195,255,0.13)",
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  signupIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(76,195,255,0.1)",
  },

  signupButtonContent: {
    flex: 1,
    paddingHorizontal: 12,
  },

  signupButtonTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  signupButtonDescription: {
    color: "#7F8AA5",
    fontSize: 10,
    marginTop: 4,
  },

  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: 23,
  },

  trustItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  trustText: {
    color: "#7F8AA6",
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 5,
  },

  trustDot: {
    width: 3,
    height: 3,
    borderRadius: 3,
    backgroundColor: "#46516C",
    marginHorizontal: 10,
  },
});
