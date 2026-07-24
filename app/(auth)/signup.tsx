import { useAppAlert } from "@/components/ui/AppAlertProvider";
import { initiateSignup, verifySignupOtp } from "@/services/auth.service";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
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
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type SignupPayload = {
  user_name: string;
  email: string;
  mobile: string;
  password: string;
};

function getSingleParam(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function SignupScreen() {
  const router = useRouter();
  const { alert } = useAppAlert();

  const params = useLocalSearchParams<{
    redirectTo?: string | string[];
    courseId?: string | string[];
  }>();

  const redirectTo = getSingleParam(params.redirectTo);

  const courseId = getSingleParam(params.courseId);

  const [step, setStep] = useState<"register" | "otp">("register");

  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigateToLogin = () => {
    router.replace({
      pathname: "/(auth)/login",
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

  const signupMutation = useMutation({
    mutationFn: (payload: SignupPayload) => initiateSignup(payload),

    onSuccess: () => {
      setStep("otp");
      setOtp("");
    },

    onError: (error: any) => {
      console.error("Signup failed:", error);

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to send the verification code. Please try again.";

      alert(
        "Unable to Create Account",
        message,
        [
          {
            text: "Try Again",
            style: "default",
            onPress: () => {
              handleSignup();
            },
          },
          {
            text: "Close",
            style: "cancel",
          },
        ],
        {
          tone: "danger",
          icon: "person-add-outline",
          cancelable: true,
        },
      );
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: () => verifySignupOtp(email.trim().toLowerCase(), otp),

    onSuccess: () => {
      alert(
        "Account Created!",
        "Your AV Art Academy account has been created successfully. Log in to continue.",
        [
          {
            text: "Continue to Login",
            style: "default",
            onPress: navigateToLogin,
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
      console.error("OTP verification failed:", error);

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "The verification code is incorrect or has expired.";

      alert(
        "Invalid Verification Code",
        message,
        [
          {
            text: "Try Again",
            style: "default",
          },
          {
            text: "Resend Code",
            style: "cancel",
            onPress: handleResendOtp,
          },
        ],
        {
          tone: "danger",
          icon: "key-outline",
          cancelable: true,
        },
      );
    },
  });

  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  };

  const handleSignup = () => {
    if (signupMutation.isPending) {
      return;
    }

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
      alert(
        "Complete All Fields",
        "Please provide your name, email address, mobile number, password and password confirmation.",
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

    if (!isValidEmail(trimmedEmail)) {
      alert(
        "Invalid Email Address",
        "Please enter a valid email address, such as name@example.com.",
        [
          {
            text: "Correct Email",
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

    if (!/^\d{10}$/.test(trimmedMobile)) {
      alert(
        "Invalid Mobile Number",
        "Please enter a valid 10-digit Indian mobile number.",
        [
          {
            text: "Correct Number",
            style: "default",
          },
        ],
        {
          tone: "warning",
          icon: "call-outline",
          cancelable: true,
        },
      );

      return;
    }

    if (password.length < 6) {
      alert(
        "Password Too Short",
        "Your password must contain at least 6 characters.",
        [
          {
            text: "Update Password",
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

    if (password !== confirmPassword) {
      alert(
        "Passwords Do Not Match",
        "The password and confirmation password must be identical.",
        [
          {
            text: "Check Passwords",
            style: "default",
          },
        ],
        {
          tone: "warning",
          icon: "shield-checkmark-outline",
          cancelable: true,
        },
      );

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
    if (verifyOtpMutation.isPending) {
      return;
    }

    const normalizedOtp = otp.replace(/\D/g, "");

    if (normalizedOtp.length !== 6) {
      alert(
        "Enter Complete Code",
        "Please enter all 6 digits from the verification email.",
        [
          {
            text: "Got It",
            style: "default",
          },
        ],
        {
          tone: "warning",
          icon: "keypad-outline",
          cancelable: true,
        },
      );

      return;
    }

    verifyOtpMutation.mutate();
  };

  const handleResendOtp = () => {
    if (signupMutation.isPending || verifyOtpMutation.isPending) {
      return;
    }

    signupMutation.mutate(
      {
        user_name: userName.trim(),
        email: email.trim().toLowerCase(),
        mobile: mobile.trim(),
        password,
      },
      {
        onSuccess: () => {
          setOtp("");

          alert(
            "Verification Code Sent",
            `A new 6-digit verification code was sent to ${email.trim().toLowerCase()}.`,
            [
              {
                text: "Enter Code",
                style: "default",
              },
            ],
            {
              tone: "success",
              icon: "mail-unread-outline",
              cancelable: true,
            },
          );
        },
      },
    );
  };

  if (step === "otp") {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <StatusBar style="light" />

        <LinearGradient
          colors={["#050A1C", "#07112B", "#110A2A"]}
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
              contentContainerStyle={styles.otpContainer}
            >
              <View style={styles.content}>
                <View style={styles.topBar}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.backButton}
                    onPress={() => setStep("register")}
                  >
                    <Ionicons name="arrow-back" size={21} color="#FFFFFF" />
                  </TouchableOpacity>

                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>STEP 2 OF 2</Text>
                  </View>
                </View>

                <View style={styles.otpCard}>
                  <LinearGradient
                    colors={["#FF3FA7", "#7C3AED", "#33D6FF"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.otpIconGradient}
                  >
                    <View style={styles.otpIconInner}>
                      <Ionicons
                        name="mail-unread-outline"
                        size={35}
                        color="#FFFFFF"
                      />
                    </View>
                  </LinearGradient>

                  <Text style={styles.otpTitle}>Verify your email</Text>

                  <Text style={styles.otpDescription}>
                    Enter the 6 digit verification code sent to
                  </Text>

                  <View style={styles.emailPill}>
                    <Ionicons name="mail-outline" size={15} color="#4CC3FF" />

                    <Text numberOfLines={1} style={styles.emailText}>
                      {email}
                    </Text>
                  </View>

                  <TextInput
                    value={otp}
                    onChangeText={(value) => setOtp(value.replace(/\D/g, ""))}
                    placeholder="000000"
                    placeholderTextColor="#46516D"
                    keyboardType="number-pad"
                    maxLength={6}
                    editable={!verifyOtpMutation.isPending}
                    returnKeyType="done"
                    onSubmitEditing={handleVerifyOtp}
                    style={styles.otpInput}
                  />

                  <Text style={styles.otpHint}>
                    Enter all 6 digits from the verification email.
                  </Text>

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
                      verifyOtpMutation.isPending && styles.buttonDisabled,
                    ]}
                  >
                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={styles.primaryButton}
                      onPress={handleVerifyOtp}
                      disabled={verifyOtpMutation.isPending}
                    >
                      {verifyOtpMutation.isPending ? (
                        <View style={styles.loadingRow}>
                          <ActivityIndicator size="small" color="#FFFFFF" />

                          <Text style={styles.primaryButtonText}>
                            Verifying...
                          </Text>
                        </View>
                      ) : (
                        <>
                          <Text style={styles.primaryButtonText}>
                            Verify Account
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

                  <View style={styles.resendSection}>
                    <Text style={styles.resendQuestion}>
                      Didn&apos;t receive the code?
                    </Text>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleResendOtp}
                      disabled={signupMutation.isPending}
                    >
                      <Text style={styles.resendText}>
                        {signupMutation.isPending
                          ? " Sending..."
                          : " Resend OTP"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.securityNote}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={18}
                    color="#86EFAC"
                  />

                  <Text style={styles.securityNoteText}>
                    Your verification code is used only to confirm your email.
                  </Text>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar style="light" />

      <LinearGradient
        colors={["#050A1C", "#07112B", "#110A2A"]}
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

                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>STEP 1 OF 2</Text>
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

              <Text style={styles.title}>Create your account</Text>

              <Text style={styles.subtitle}>
                Join AV Art Academy and start preparing for your artistic goals.
              </Text>

              {courseId && (
                <View style={styles.courseContextCard}>
                  <View style={styles.courseContextIcon}>
                    <Ionicons name="book-outline" size={21} color="#4CC3FF" />
                  </View>

                  <View style={styles.courseContextContent}>
                    <Text style={styles.courseContextTitle}>
                      Continue with your course
                    </Text>

                    <Text style={styles.courseContextDescription}>
                      Your selected course will be available after signup and
                      login.
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.formCard}>
                <View style={styles.progressContainer}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressTitle}>Account details</Text>

                    <Text style={styles.progressValue}>50%</Text>
                  </View>

                  <View style={styles.progressTrack}>
                    <LinearGradient
                      colors={["#FF3FA7", "#7C3AED", "#33D6FF"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.progressFill}
                    />
                  </View>
                </View>

                <Text style={styles.label}>Full name</Text>

                <View style={styles.inputContainer}>
                  <View style={styles.inputIcon}>
                    <Ionicons name="person-outline" size={20} color="#8290AF" />
                  </View>

                  <TextInput
                    value={userName}
                    onChangeText={setUserName}
                    placeholder="Enter your full name"
                    placeholderTextColor="#65708D"
                    autoCapitalize="words"
                    editable={!signupMutation.isPending}
                    style={styles.input}
                  />
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
                    editable={!signupMutation.isPending}
                    style={styles.input}
                  />
                </View>

                <Text style={styles.label}>Mobile number</Text>

                <View style={styles.inputContainer}>
                  <View style={styles.countryCode}>
                    <Text style={styles.countryCodeText}>+91</Text>
                  </View>

                  <TextInput
                    value={mobile}
                    onChangeText={(value) =>
                      setMobile(value.replace(/\D/g, ""))
                    }
                    placeholder="10 digit mobile number"
                    placeholderTextColor="#65708D"
                    keyboardType="phone-pad"
                    maxLength={10}
                    editable={!signupMutation.isPending}
                    style={styles.input}
                  />
                </View>

                <Text style={styles.label}>Password</Text>

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
                    placeholder="Minimum 6 characters"
                    placeholderTextColor="#65708D"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!signupMutation.isPending}
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
                    placeholder="Re-enter your password"
                    placeholderTextColor="#65708D"
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!signupMutation.isPending}
                    returnKeyType="done"
                    onSubmitEditing={handleSignup}
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
                        showConfirmPassword ? "eye-outline" : "eye-off-outline"
                      }
                      size={21}
                      color="#8290AF"
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.passwordHint}>
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color="#93C5FD"
                  />

                  <Text style={styles.passwordHintText}>
                    Use at least 6 characters for your password.
                  </Text>
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
                    signupMutation.isPending && styles.buttonDisabled,
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.primaryButton}
                    onPress={handleSignup}
                    disabled={signupMutation.isPending}
                  >
                    {signupMutation.isPending ? (
                      <View style={styles.loadingRow}>
                        <ActivityIndicator size="small" color="#FFFFFF" />

                        <Text style={styles.primaryButtonText}>
                          Sending OTP...
                        </Text>
                      </View>
                    ) : (
                      <>
                        <Text style={styles.primaryButtonText}>
                          Continue to Verification
                        </Text>

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

                <View style={styles.loginRow}>
                  <Text style={styles.loginText}>Already have an account?</Text>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={navigateToLogin}
                  >
                    <Text style={styles.loginLink}> Sign In</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.policyRow}>
                <Text style={styles.termsText}>
                  By continuing, you agree to the AV Art Academy{" "}
                </Text>

                <TouchableOpacity
                  onPress={() => router.push("/information/terms-of-use")}
                >
                  <Text style={styles.policyLink}>Terms of Use</Text>
                </TouchableOpacity>

                <Text style={styles.termsText}> and </Text>

                <TouchableOpacity
                  onPress={() => router.push("/information/privacy-policy")}
                >
                  <Text style={styles.policyLink}>Privacy Policy</Text>
                </TouchableOpacity>
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
    backgroundColor: "rgba(255,63,167,0.14)",
  },

  glowTopRight: {
    position: "absolute",
    top: 100,
    right: -150,
    width: 310,
    height: 310,
    borderRadius: 310,
    backgroundColor: "rgba(124,58,237,0.16)",
  },

  glowBottom: {
    position: "absolute",
    bottom: -150,
    left: -100,
    width: 340,
    height: 340,
    borderRadius: 340,
    backgroundColor: "rgba(51,214,255,0.1)",
  },

  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 22,
  },

  otpContainer: {
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
    marginBottom: 24,
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

  stepBadge: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(76,195,255,0.18)",
    backgroundColor: "rgba(76,195,255,0.08)",
  },

  stepBadgeText: {
    color: "#93C5FD",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  brandSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 27,
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
    fontSize: 33,
    lineHeight: 40,
    fontWeight: "900",
    letterSpacing: -0.8,
  },

  subtitle: {
    color: "#AAB4CC",
    fontSize: 15,
    lineHeight: 23,
    marginTop: 10,
    marginBottom: 21,
  },

  courseContextCard: {
    minHeight: 75,
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
    paddingLeft: 12,
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

  progressContainer: {
    marginBottom: 23,
  },

  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 9,
  },

  progressTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  progressValue: {
    color: "#4CC3FF",
    fontSize: 11,
    fontWeight: "900",
  },

  progressTrack: {
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  progressFill: {
    width: "50%",
    height: "100%",
    borderRadius: 999,
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

  countryCode: {
    height: 40,
    paddingHorizontal: 13,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    marginRight: 10,
    borderRadius: 12,
    backgroundColor: "rgba(76,195,255,0.08)",
  },

  countryCodeText: {
    color: "#DCEBFF",
    fontSize: 14,
    fontWeight: "800",
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

  passwordHint: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: -4,
    marginBottom: 18,
  },

  passwordHintText: {
    flex: 1,
    color: "#8290AA",
    fontSize: 10,
    lineHeight: 16,
    marginLeft: 6,
  },

  buttonGradient: {
    borderRadius: 17,
    overflow: "hidden",
    shadowColor: "#33D6FF",
    shadowOpacity: 0.28,
    shadowRadius: 15,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    elevation: 8,
  },

  buttonDisabled: {
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
    fontSize: 14,
    fontWeight: "900",
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

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  loginRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: 20,
  },

  loginText: {
    color: "#8995AF",
    fontSize: 12,
  },

  loginLink: {
    color: "#4CC3FF",
    fontSize: 12,
    fontWeight: "900",
  },

  termsText: {
    color: "#65708B",
    textAlign: "center",
    fontSize: 10,
    lineHeight: 16,
  },

  otpCard: {
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 29,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(12,20,48,0.94)",
  },

  otpIconGradient: {
    width: 82,
    height: 82,
    borderRadius: 27,
    padding: 2,
  },

  otpIconInner: {
    flex: 1,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111936",
  },

  otpTitle: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 21,
  },

  otpDescription: {
    color: "#96A1BA",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 9,
  },

  emailPill: {
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(76,195,255,0.15)",
    backgroundColor: "rgba(76,195,255,0.07)",
    marginTop: 13,
  },

  emailText: {
    flexShrink: 1,
    color: "#B9D8FF",
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 7,
  },

  otpInput: {
    width: "100%",
    minHeight: 72,
    borderRadius: 18,
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 27,
    fontWeight: "900",
    letterSpacing: 12,
    paddingLeft: 12,
    borderWidth: 1,
    borderColor: "rgba(76,195,255,0.2)",
    backgroundColor: "#09122E",
    marginTop: 25,
  },

  otpHint: {
    color: "#68748E",
    fontSize: 10,
    textAlign: "center",
    marginTop: 9,
    marginBottom: 22,
  },

  resendSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: 20,
  },

  resendQuestion: {
    color: "#8591AA",
    fontSize: 12,
  },

  resendText: {
    color: "#4CC3FF",
    fontSize: 12,
    fontWeight: "900",
  },

  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 17,
    marginTop: 19,
  },

  securityNoteText: {
    flex: 1,
    color: "#77839D",
    fontSize: 10,
    lineHeight: 16,
    marginLeft: 8,
  },
  policyRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    marginTop: 20,
  },

  policyLink: {
    color: "#4CC3FF",
    fontSize: 10,
    lineHeight: 16,
    fontWeight: "800",
  },
});
