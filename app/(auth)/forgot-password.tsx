import { useAppAlert } from "@/components/ui/AppAlertProvider";
import {
  initiateForgotPassword,
  verifyForgotPassword,
} from "@/services/auth.service";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
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

type ResetStep = "request" | "verify";
type RedirectTarget = "home" | "course-detail" | "course-dashboard";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getSingleParam(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getErrorMessage(error: any, fallback: string): string {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

export default function ForgotPasswordScreen() {
  const { alert } = useAppAlert();
  const router = useRouter();
  const params = useLocalSearchParams<{
    email?: string | string[];
    redirectTo?: string | string[];
    courseId?: string | string[];
  }>();

  const initialEmail = getSingleParam(params.email)?.trim().toLowerCase() ?? "";
  const redirectTo = getSingleParam(params.redirectTo) as
    | RedirectTarget
    | undefined;
  const courseId = getSingleParam(params.courseId);

  const [step, setStep] = useState<ResetStep>("request");
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const normalizedEmail = useMemo(
    () => email.trim().toLowerCase(),
    [email],
  );
  const normalizedOtp = useMemo(() => otp.replace(/\D/g, ""), [otp]);

  const loginParams = {
    ...(normalizedEmail ? { email: normalizedEmail } : {}),
    ...(redirectTo ? { redirectTo } : {}),
    ...(courseId ? { courseId } : {}),
  };

  const requestOtpMutation = useMutation({
    mutationFn: () => initiateForgotPassword(normalizedEmail),
    onSuccess: () => {
      setStep("verify");
      alert(
        "OTP Sent",
        `A password-reset OTP was sent to ${normalizedEmail}.`,
        [{ text: "Continue", style: "default" }],
        {
          tone: "success",
          icon: "mail-unread-outline",
          cancelable: true,
        },
      );
    },
    onError: (error: any) => {
      alert(
        "Could Not Send OTP",
        getErrorMessage(error, "Failed to send the OTP. Please try again."),
        [{ text: "Try Again", style: "default" }],
        {
          tone: "danger",
          icon: "warning-outline",
          cancelable: true,
        },
      );
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: () =>
      verifyForgotPassword({
        email: normalizedEmail,
        otp: normalizedOtp,
        newPassword,
      }),
    onSuccess: () => {
      alert(
        "Password Reset Successfully",
        "Your password has been updated. You can now sign in using your new password.",
        [
          {
            text: "Go to Login",
            style: "default",
            onPress: () => {
              router.replace({
                pathname: "/(auth)/login",
                params: loginParams,
              });
            },
          },
        ],
        {
          tone: "success",
          icon: "checkmark-circle-outline",
          cancelable: false,
        },
      );
    },
    onError: (error: any) => {
      alert(
        "Password Reset Failed",
        getErrorMessage(
          error,
          "The OTP may be incorrect or expired. Please check it and try again.",
        ),
        [{ text: "Try Again", style: "default" }],
        {
          tone: "danger",
          icon: "lock-closed-outline",
          cancelable: true,
        },
      );
    },
  });

  const isPending =
    requestOtpMutation.isPending || resetPasswordMutation.isPending;

  const validateEmail = (): boolean => {
    if (!normalizedEmail) {
      alert(
        "Email Required",
        "Please enter the email address registered with your account.",
        [{ text: "Got It", style: "default" }],
        {
          tone: "warning",
          icon: "mail-outline",
          cancelable: true,
        },
      );
      return false;
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      alert(
        "Invalid Email",
        "Please enter a valid email address.",
        [{ text: "Got It", style: "default" }],
        {
          tone: "warning",
          icon: "mail-outline",
          cancelable: true,
        },
      );
      return false;
    }

    return true;
  };

  const handleRequestOtp = () => {
    if (isPending || !validateEmail()) {
      return;
    }

    requestOtpMutation.mutate();
  };

  const handleResetPassword = () => {
    if (isPending || !validateEmail()) {
      return;
    }

    if (normalizedOtp.length !== 6) {
      alert(
        "Enter Complete OTP",
        "Please enter all 6 digits sent to your email address.",
        [{ text: "Got It", style: "default" }],
        {
          tone: "warning",
          icon: "keypad-outline",
          cancelable: true,
        },
      );
      return;
    }

    if (newPassword.length < 6) {
      alert(
        "Password Too Short",
        "Your new password must contain at least 6 characters.",
        [{ text: "Got It", style: "default" }],
        {
          tone: "warning",
          icon: "lock-closed-outline",
          cancelable: true,
        },
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      alert(
        "Passwords Do Not Match",
        "Please make sure both password fields contain the same value.",
        [{ text: "Got It", style: "default" }],
        {
          tone: "warning",
          icon: "alert-circle-outline",
          cancelable: true,
        },
      );
      return;
    }

    resetPasswordMutation.mutate();
  };

  const handleBack = () => {
    if (step === "verify") {
      setStep("request");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      return;
    }

    router.replace({
      pathname: "/(auth)/login",
      params: loginParams,
    });
  };

  const handleChangeEmail = () => {
    setStep("request");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleResendOtp = () => {
    if (!isPending && validateEmail()) {
      setOtp("");
      requestOtpMutation.mutate();
    }
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
                  disabled={isPending}
                >
                  <Ionicons name="arrow-back" size={21} color="#FFFFFF" />
                </TouchableOpacity>

                <View style={styles.secureBadge}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={14}
                    color="#86EFAC"
                  />
                  <Text style={styles.secureBadgeText}>SECURE RESET</Text>
                </View>
              </View>

              <View style={styles.brandSection}>
                <LinearGradient
                  colors={["#33D6FF", "#8B5CF6", "#FF3FA7"]}
                  style={styles.logoGradient}
                >
                  <View style={styles.logoInner}>
                    <Ionicons name="key-outline" size={29} color="#FFFFFF" />
                  </View>
                </LinearGradient>

                <View style={styles.brandTextContainer}>
                  <View style={styles.brandRow}>
                    <Text style={styles.brand}>AV Art</Text>
                    <Text style={styles.brandAccent}>Academy</Text>
                  </View>
                  <Text style={styles.brandTagline}>Learn. Create. Succeed.</Text>
                </View>
              </View>

              <Text style={styles.title}>
                {step === "request" ? "Forgot password?" : "Create new password"}
              </Text>
              <Text style={styles.subtitle}>
                {step === "request"
                  ? "Enter your registered email address and we will send you an OTP."
                  : `Enter the OTP sent to ${normalizedEmail} and choose a new password.`}
              </Text>

              <View style={styles.stepsRow}>
                <View
                  style={[
                    styles.stepPill,
                    styles.stepPillActive,
                  ]}
                >
                  <Text style={styles.stepNumber}>1</Text>
                  <Text style={styles.stepText}>Email</Text>
                </View>
                <View
                  style={[
                    styles.stepLine,
                    step === "verify" && styles.stepLineActive,
                  ]}
                />
                <View
                  style={[
                    styles.stepPill,
                    step === "verify" && styles.stepPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepNumber,
                      step !== "verify" && styles.stepNumberInactive,
                    ]}
                  >
                    2
                  </Text>
                  <Text
                    style={[
                      styles.stepText,
                      step !== "verify" && styles.stepTextInactive,
                    ]}
                  >
                    Reset
                  </Text>
                </View>
              </View>

              <View style={styles.formCard}>
                {step === "request" ? (
                  <>
                    <View style={styles.formHeader}>
                      <Text style={styles.formTitle}>Find your account</Text>
                      <Text style={styles.formDescription}>
                        Use the same email address you used while signing up.
                      </Text>
                    </View>

                    <Text style={styles.label}>Email address</Text>
                    <View style={styles.inputContainer}>
                      <View style={styles.inputIcon}>
                        <Ionicons
                          name="mail-outline"
                          size={20}
                          color="#8290AF"
                        />
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
                        editable={!isPending}
                        returnKeyType="send"
                        onSubmitEditing={handleRequestOtp}
                        style={styles.input}
                      />
                    </View>

                    <LinearGradient
                      colors={["#1EA7FF", "#7C4DFF", "#D946EF"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        styles.primaryGradient,
                        isPending && styles.primaryGradientDisabled,
                      ]}
                    >
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={handleRequestOtp}
                        disabled={isPending}
                        style={styles.primaryButton}
                      >
                        {requestOtpMutation.isPending ? (
                          <View style={styles.loadingRow}>
                            <ActivityIndicator size="small" color="#FFFFFF" />
                            <Text style={styles.primaryButtonText}>
                              Sending OTP...
                            </Text>
                          </View>
                        ) : (
                          <>
                            <Text style={styles.primaryButtonText}>Send OTP</Text>
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
                  </>
                ) : (
                  <>
                    <View style={styles.formHeader}>
                      <Text style={styles.formTitle}>Verify and reset</Text>
                      <Text style={styles.formDescription}>
                        The OTP is time-sensitive. Request another one if it has
                        expired.
                      </Text>
                    </View>

                    <Text style={styles.label}>OTP</Text>
                    <View style={styles.inputContainer}>
                      <View style={styles.inputIcon}>
                        <Ionicons
                          name="keypad-outline"
                          size={20}
                          color="#8290AF"
                        />
                      </View>
                      <TextInput
                        value={otp}
                        onChangeText={(value) =>
                          setOtp(value.replace(/[^0-9]/g, ""))
                        }
                        placeholder="000000"
                        placeholderTextColor="#65708D"
                        keyboardType="number-pad"
                        maxLength={6}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="one-time-code"
                        textContentType="oneTimeCode"
                        editable={!isPending}
                        returnKeyType="next"
                        style={styles.input}
                      />
                    </View>

                    <Text style={styles.label}>New password</Text>
                    <View style={styles.inputContainer}>
                      <View style={styles.inputIcon}>
                        <Ionicons
                          name="lock-closed-outline"
                          size={20}
                          color="#8290AF"
                        />
                      </View>
                      <TextInput
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder="Minimum 6 characters"
                        placeholderTextColor="#65708D"
                        secureTextEntry={!showNewPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="new-password"
                        editable={!isPending}
                        style={styles.input}
                      />
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() =>
                          setShowNewPassword((current) => !current)
                        }
                        style={styles.eyeButton}
                      >
                        <Ionicons
                          name={
                            showNewPassword ? "eye-outline" : "eye-off-outline"
                          }
                          size={21}
                          color="#8290AF"
                        />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>Confirm password</Text>
                    <View style={styles.inputContainer}>
                      <View style={styles.inputIcon}>
                        <Ionicons
                          name="shield-checkmark-outline"
                          size={20}
                          color="#8290AF"
                        />
                      </View>
                      <TextInput
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Re-enter your new password"
                        placeholderTextColor="#65708D"
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="new-password"
                        editable={!isPending}
                        returnKeyType="done"
                        onSubmitEditing={handleResetPassword}
                        style={styles.input}
                      />
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() =>
                          setShowConfirmPassword((current) => !current)
                        }
                        style={styles.eyeButton}
                      >
                        <Ionicons
                          name={
                            showConfirmPassword
                              ? "eye-outline"
                              : "eye-off-outline"
                          }
                          size={21}
                          color="#8290AF"
                        />
                      </TouchableOpacity>
                    </View>

                    <LinearGradient
                      colors={["#1EA7FF", "#7C4DFF", "#D946EF"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        styles.primaryGradient,
                        isPending && styles.primaryGradientDisabled,
                      ]}
                    >
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={handleResetPassword}
                        disabled={isPending}
                        style={styles.primaryButton}
                      >
                        {resetPasswordMutation.isPending ? (
                          <View style={styles.loadingRow}>
                            <ActivityIndicator size="small" color="#FFFFFF" />
                            <Text style={styles.primaryButtonText}>
                              Resetting Password...
                            </Text>
                          </View>
                        ) : (
                          <>
                            <Text style={styles.primaryButtonText}>
                              Reset Password
                            </Text>
                            <View style={styles.buttonArrowContainer}>
                              <Ionicons
                                name="checkmark"
                                size={20}
                                color="#FFFFFF"
                              />
                            </View>
                          </>
                        )}
                      </TouchableOpacity>
                    </LinearGradient>

                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleChangeEmail}
                        disabled={isPending}
                      >
                        <Text style={styles.secondaryAction}>Change email</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleResendOtp}
                        disabled={isPending}
                      >
                        <Text style={styles.secondaryAction}>Resend OTP</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  router.replace({
                    pathname: "/(auth)/login",
                    params: loginParams,
                  })
                }
                disabled={isPending}
                style={styles.loginLink}
              >
                <Ionicons name="arrow-back" size={15} color="#4CC3FF" />
                <Text style={styles.loginLinkText}>Back to login</Text>
              </TouchableOpacity>

              <View style={styles.trustRow}>
                <View style={styles.trustItem}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={13}
                    color="#6D7894"
                  />
                  <Text style={styles.trustText}>Secure verification</Text>
                </View>
                <View style={styles.trustDot} />
                <View style={styles.trustItem}>
                  <Ionicons
                    name="mail-outline"
                    size={13}
                    color="#6D7894"
                  />
                  <Text style={styles.trustText}>Email OTP</Text>
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
    marginBottom: 19,
  },
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  stepPill: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 34,
    paddingHorizontal: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  stepPillActive: {
    borderColor: "rgba(76,195,255,0.24)",
    backgroundColor: "rgba(76,195,255,0.09)",
  },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    color: "#07112B",
    backgroundColor: "#4CC3FF",
    textAlign: "center",
    lineHeight: 20,
    fontSize: 10,
    fontWeight: "900",
  },
  stepNumberInactive: {
    color: "#8B96AE",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  stepText: {
    color: "#E8F7FF",
    fontSize: 10,
    fontWeight: "800",
    marginLeft: 7,
  },
  stepTextInactive: {
    color: "#69758F",
  },
  stepLine: {
    flex: 1,
    height: 1,
    marginHorizontal: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  stepLineActive: {
    backgroundColor: "rgba(76,195,255,0.4)",
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
  primaryGradient: {
    borderRadius: 17,
    overflow: "hidden",
    marginTop: 5,
    shadowColor: "#33D6FF",
    shadowOpacity: 0.28,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 7 },
    elevation: 8,
  },
  primaryGradientDisabled: {
    shadowOpacity: 0.1,
    elevation: 2,
  },
  primaryButton: {
    minHeight: 57,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
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
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
    paddingHorizontal: 2,
  },
  secondaryAction: {
    color: "#4CC3FF",
    fontSize: 12,
    fontWeight: "800",
  },
  loginLink: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 22,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  loginLinkText: {
    color: "#4CC3FF",
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 6,
  },
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: 14,
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
