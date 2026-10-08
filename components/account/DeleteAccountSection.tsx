import React, { useState } from "react";

import {
    ActivityIndicator,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { AlertTriangle, ShieldAlert, Trash2, X } from "lucide-react-native";

import * as SecureStore from "expo-secure-store";

import { useRouter } from "expo-router";

import {
    requestDeleteAccountOtp,
    verifyDeleteAccountOtp,
} from "@/services/accountDeletion.service";

type Step = null | "confirm" | "otp" | "success";

interface DeleteAccountSectionProps {
  onAccountScheduledForDeletion?: () => void | Promise<void>;
}

export default function DeleteAccountSection({
  onAccountScheduledForDeletion,
}: DeleteAccountSectionProps) {
  const router = useRouter();

  const [step, setStep] = useState<Step>(null);

  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [deletionScheduledAt, setDeletionScheduledAt] = useState<string | null>(
    null,
  );

  // =========================================
  // REQUEST OTP
  // =========================================

  const handleRequestOtp = async () => {
    try {
      setLoading(true);
      setError("");

      await requestDeleteAccountOtp();

      setOtp("");
      setStep("otp");
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to send verification code.",
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // VERIFY OTP
  // =========================================

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError("Enter the 6-digit verification code.");

      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await verifyDeleteAccountOtp(otp);

      if (data.deletionScheduledAt) {
        setDeletionScheduledAt(data.deletionScheduledAt);
      }

      /*
       * Account is pending deletion now.
       * Remove all login credentials.
       */
      await SecureStore.deleteItemAsync("accessToken");

      await SecureStore.deleteItemAsync("refreshToken");

      setStep("success");
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Invalid or expired verification code.",
      );
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    if (loading) return;

    setStep(null);
    setOtp("");
    setError("");
  };

  const formattedDeletionDate = deletionScheduledAt
    ? new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      }).format(new Date(deletionScheduledAt))
    : null;

  return (
    <>
      {/* =====================================
          DANGER ZONE
      ====================================== */}

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.warningIcon}>
            <AlertTriangle size={20} color="#f87171" />
          </View>

          <View style={styles.cardText}>
            <Text style={styles.label}>ACCOUNT</Text>

            <Text style={styles.title}>Delete Account</Text>
          </View>
        </View>

        <Text style={styles.description}>
          Your account will be scheduled for permanent deletion. You will have
          30 days to reactivate it before your account and associated data are
          permanently removed.
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && {
              opacity: 0.8,
            },
          ]}
          onPress={() => setStep("confirm")}
        >
          <Trash2 size={17} color="#f87171" />

          <Text style={styles.deleteButtonText}>Delete Account</Text>
        </Pressable>
      </View>

      {/* =====================================
          CONFIRM MODAL
      ====================================== */}

      <Modal
        visible={step === "confirm"}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Pressable style={styles.closeButton} onPress={closeModal}>
              <X size={18} color="#8492b8" />
            </Pressable>

            <View style={styles.warningIconLarge}>
              <AlertTriangle size={24} color="#f87171" />
            </View>

            <Text style={styles.modalLabel}>ACCOUNT DELETION</Text>

            <Text style={styles.modalTitle}>Delete your account?</Text>

            <Text style={styles.modalDescription}>
              We'll send a verification code to your registered email address.
            </Text>

            <View style={styles.notice}>
              <ShieldAlert size={19} color="#fbbf24" />

              <Text style={styles.noticeText}>
                You have 30 days to reactivate your account before permanent
                deletion.
              </Text>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.buttonRow}>
              <Pressable
                style={styles.cancelButton}
                onPress={closeModal}
                disabled={loading}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.confirmButton}
                onPress={handleRequestOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmText}>Send Code</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* =====================================
          OTP MODAL
      ====================================== */}

      <Modal
        visible={step === "otp"}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Pressable style={styles.closeButton} onPress={closeModal}>
              <X size={18} color="#8492b8" />
            </Pressable>

            <View style={styles.infoIcon}>
              <ShieldAlert size={24} color="#8294ff" />
            </View>

            <Text style={styles.modalLabel}>VERIFICATION</Text>

            <Text style={styles.modalTitle}>Enter verification code</Text>

            <Text style={styles.modalDescription}>
              Enter the 6-digit code sent to your registered email.
            </Text>

            <TextInput
              value={otp}
              onChangeText={(value) => {
                const numeric = value.replace(/\D/g, "");

                setOtp(numeric.slice(0, 6));

                setError("");
              }}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="000000"
              placeholderTextColor="#394365"
              style={styles.otpInput}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              style={[
                styles.verifyButton,
                otp.length !== 6 && styles.disabledButton,
              ]}
              onPress={handleVerifyOtp}
              disabled={loading || otp.length !== 6}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.verifyText}>
                  Verify & Schedule Deletion
                </Text>
              )}
            </Pressable>

            <Pressable onPress={handleRequestOtp} disabled={loading}>
              <Text style={styles.resendText}>Resend verification code</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* =====================================
          SUCCESS
      ====================================== */}

      <Modal
        visible={step === "success"}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.infoIcon}>
              <Trash2 size={23} color="#8294ff" />
            </View>

            <Text style={styles.modalLabel}>REQUEST CONFIRMED</Text>

            <Text style={styles.modalTitle}>Account deletion scheduled</Text>

            <Text style={styles.modalDescription}>
              Your AV Art Academy account is now scheduled for permanent
              deletion.
            </Text>

            {formattedDeletionDate ? (
              <View style={styles.dateCard}>
                <Text style={styles.dateLabel}>PERMANENT DELETION DATE</Text>

                <Text style={styles.dateValue}>{formattedDeletionDate}</Text>
              </View>
            ) : null}

            <Text style={styles.modalDescription}>
              You can reactivate your account by signing in again before this
              date.
            </Text>

            <Pressable
              style={styles.verifyButton}
              onPress={async () => {
                await onAccountScheduledForDeletion?.();
              }}
            >
              <Text style={styles.verifyText}>Continue</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#2a3158",
    borderRadius: 18,
    padding: 20,
    backgroundColor: "#090e23",
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  cardText: {
    flex: 1,
  },

  warningIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.25)",
    backgroundColor: "rgba(248,113,113,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },

  label: {
    fontSize: 11,
    color: "#7485b3",
    letterSpacing: 1.6,
    fontWeight: "600",
  },

  title: {
    marginTop: 3,
    color: "#f2f5ff",
    fontSize: 18,
    fontWeight: "700",
  },

  description: {
    marginTop: 16,
    color: "#8492b8",
    fontSize: 14,
    lineHeight: 22,
  },

  deleteButton: {
    marginTop: 18,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.4)",
    backgroundColor: "rgba(248,113,113,0.1)",
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  deleteButtonText: {
    color: "#f87171",
    fontWeight: "700",
    fontSize: 14,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(2,5,15,0.88)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  modal: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#29325a",
    backgroundColor: "#090e23",
    padding: 24,
  },

  closeButton: {
    position: "absolute",
    right: 16,
    top: 16,
    padding: 8,
    zIndex: 10,
  },

  warningIconLarge: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: "rgba(248,113,113,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },

  infoIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: "rgba(102,117,230,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  modalLabel: {
    marginTop: 20,
    color: "#6f80aa",
    fontSize: 11,
    letterSpacing: 1.6,
    fontWeight: "700",
  },

  modalTitle: {
    marginTop: 7,
    color: "#ffffff",
    fontSize: 23,
    fontWeight: "700",
  },

  modalDescription: {
    marginTop: 12,
    color: "#8c99bb",
    fontSize: 14,
    lineHeight: 22,
  },

  notice: {
    marginTop: 18,
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.2)",
    backgroundColor: "rgba(251,191,36,0.06)",
  },

  noticeText: {
    flex: 1,
    color: "#c6b98b",
    lineHeight: 20,
    fontSize: 13,
  },

  error: {
    marginTop: 14,
    color: "#f87171",
    fontSize: 13,
  },

  buttonRow: {
    marginTop: 24,
    flexDirection: "row",
    gap: 12,
  },

  cancelButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#30385f",
    justifyContent: "center",
    alignItems: "center",
  },

  cancelText: {
    color: "#9aa8ca",
    fontWeight: "600",
  },

  confirmButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
  },

  confirmText: {
    color: "#fff",
    fontWeight: "700",
  },

  otpInput: {
    marginTop: 22,
    height: 58,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#30385f",
    backgroundColor: "#070c1e",
    color: "#fff",
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 10,
  },

  verifyButton: {
    marginTop: 22,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#5868d8",
    justifyContent: "center",
    alignItems: "center",
  },

  verifyText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  disabledButton: {
    opacity: 0.45,
  },

  resendText: {
    marginTop: 18,
    textAlign: "center",
    color: "#8294ff",
    fontWeight: "600",
    fontSize: 13,
  },

  dateCard: {
    marginTop: 18,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#29325b",
    backgroundColor: "#070c1e",
  },

  dateLabel: {
    color: "#66759e",
    fontSize: 10,
    letterSpacing: 1.3,
    fontWeight: "700",
  },

  dateValue: {
    marginTop: 7,
    color: "#dce4ff",
    fontSize: 17,
    fontWeight: "700",
  },
});
