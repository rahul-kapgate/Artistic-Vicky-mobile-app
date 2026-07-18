import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { usePreventRemove } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getLiveTestSession,
  getPublicLiveTests,
  startLiveTest,
  submitLiveTest,
} from "@/services/liveTest.service";
import type {
  LiveTestAnswer,
  LiveTestSession,
  PublicLiveTest,
} from "@/types/live-test";
import type { MockTestOption, MockTestQuestion } from "@/types/mock-test";

const COLORS = {
  background: "#07090F",
  panel: "#0C1020",
  panelSoft: "#0A0E1A",
  white: "#F8FAFC",
  text: "#D1D5DB",
  muted: "#7C8597",
  border: "rgba(255,255,255,0.08)",
  cyan: "#22D3EE",
  blue: "#2563EB",
  green: "#34D399",
  amber: "#FBBF24",
  red: "#F87171",
};

type IntroState = "upcoming" | "live" | "ended";

function getParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function formatTime(seconds: number): string {
  const safe = Math.max(0, seconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;

  return [hours, minutes, secs]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function formatDateTime(value?: string | null): string {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getIntroState(meta: PublicLiveTest, now: number): IntroState {
  const start = meta.start_at ? new Date(meta.start_at).getTime() : null;
  const end = meta.end_at ? new Date(meta.end_at).getTime() : null;

  if (end && now >= end) return "ended";
  if (start && now < start) return "upcoming";
  return "live";
}

function getTimerColor(timeLeft: number) {
  if (timeLeft <= 300) return COLORS.red;
  if (timeLeft <= 900) return COLORS.amber;
  return COLORS.cyan;
}

function OptionItem({
  option,
  index,
  selected,
  onPress,
}: {
  option: MockTestOption;
  index: number;
  selected: boolean;
  onPress: () => void;
}) {
  const labels = ["A", "B", "C", "D", "E", "F"];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionCard,
        selected && styles.optionCardSelected,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.optionLabel,
          selected && styles.optionLabelSelected,
        ]}
      >
        <Text
          style={[
            styles.optionLabelText,
            selected && styles.optionLabelTextSelected,
          ]}
        >
          {labels[index] ?? index + 1}
        </Text>
      </View>

      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
        {option.text}
      </Text>

      {selected ? (
        <Ionicons name="checkmark-circle" size={21} color={COLORS.cyan} />
      ) : null}
    </Pressable>
  );
}

export default function LiveTestScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const testId = getParam(params.id);
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();

  const isTablet = width >= 768;
  const isCompact = width < 360 || height < 700;
  const horizontalPadding = isTablet ? 28 : isCompact ? 14 : 16;
  const contentMaxWidth = isTablet ? 760 : undefined;
  const trackerColumns = width < 360 ? 4 : isTablet ? 7 : 5;

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [meta, setMeta] = useState<PublicLiveTest | null>(null);
  const [session, setSession] = useState<LiveTestSession | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [trackerOpen, setTrackerOpen] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [canLeave, setCanLeave] = useState(false);

  const answersRef = useRef<Record<number, number>>({});
  const autoSubmitRef = useRef(false);
  const pendingNavigationAction = useRef<unknown>(null);

  const applySession = useCallback((nextSession: LiveTestSession) => {
    setSession(nextSession);
    setMeta({
      id: nextSession.test.id,
      title: nextSession.test.title,
      description: nextSession.test.description,
      course_id: 0,
      duration_minutes: nextSession.test.duration_minutes,
      total_questions: nextSession.test.total_questions,
      start_at: nextSession.test.start_at,
      end_at: nextSession.test.end_at,
    });

    const restoredAnswers: Record<number, number> = {};
    (nextSession.answers ?? []).forEach((answer) => {
      restoredAnswers[answer.question_id] = answer.selected_option_id;
    });

    answersRef.current = restoredAnswers;
    setAnswers(restoredAnswers);
    setTimeLeft(nextSession.remaining_seconds ?? 0);
    setServerOffsetMs(
      new Date(nextSession.server_now).getTime() - Date.now(),
    );

    if (
      nextSession.status === "submitted" ||
      nextSession.status === "auto_submitted"
    ) {
      setSubmittedMessage(
        "You have already submitted this live test. Results will be announced shortly.",
      );
    } else if (nextSession.status === "expired") {
      setSubmittedMessage(
        "This live test session has expired. Results will be announced shortly.",
      );
    }
  }, []);

  const load = useCallback(async () => {
    if (!testId) {
      setScreenError("Invalid live test ID.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setScreenError(null);

      const existingSession = await getLiveTestSession(testId);

      if (existingSession) {
        applySession(existingSession);
        return;
      }

      const publicTests = await getPublicLiveTests();
      const found = publicTests.find((item) => Number(item.id) === Number(testId));

      if (!found) {
        throw new Error("Live test not found or no longer published.");
      }

      setMeta(found);
    } catch (error: any) {
      setScreenError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load live test.",
      );
    } finally {
      setLoading(false);
    }
  }, [applySession, testId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const active = Boolean(session && !submittedMessage);

  usePreventRemove(active && !canLeave, ({ data }) => {
    Alert.alert(
      "Leave live test?",
      "Your current answers will be submitted before leaving.",
      [
        { text: "Stay", style: "cancel" },
        {
          text: "Exit & Submit",
          style: "destructive",
          onPress: () => {
            void (async () => {
              const ok = await performSubmit(false);
              if (!ok) return;

              pendingNavigationAction.current = data.action;
              setCanLeave(true);
            })();
          },
        },
      ],
    );
  });

  useEffect(() => {
    if (!canLeave || !pendingNavigationAction.current) return;

    const action = pendingNavigationAction.current;
    pendingNavigationAction.current = null;

    requestAnimationFrame(() => navigation.dispatch(action as never));
  }, [canLeave, navigation]);

  useEffect(() => {
    if (!session || submittedMessage) return;

    const calculate = () => {
      const serverNow = Date.now() + serverOffsetMs;
      const expiresAt = new Date(session.expires_at).getTime();
      const remaining = Math.max(
        0,
        Math.floor((expiresAt - serverNow) / 1000),
      );

      setTimeLeft(remaining);

      if (remaining === 0 && !autoSubmitRef.current) {
        autoSubmitRef.current = true;
        void performSubmit(true);
      }
    };

    calculate();
    const interval = setInterval(calculate, 1000);

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") calculate();
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [serverOffsetMs, session, submittedMessage]);

  const questions = session?.test.questions ?? [];
  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progress =
    questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  const introState = meta ? getIntroState(meta, now) : "upcoming";

  const introCountdown = useMemo(() => {
    if (!meta) return 0;

    const target =
      introState === "upcoming"
        ? meta.start_at
        : introState === "live"
          ? meta.end_at
          : null;

    if (!target) return 0;

    return Math.max(
      0,
      Math.floor((new Date(target).getTime() - now) / 1000),
    );
  }, [introState, meta, now]);

  const handleStart = async () => {
    if (!testId) return;

    try {
      setStarting(true);
      const nextSession = await startLiveTest(testId);
      applySession(nextSession);
      autoSubmitRef.current = false;
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
    } catch (error: any) {
      Alert.alert(
        "Unable to start test",
        error?.response?.data?.message ||
          error?.message ||
          "Please try again.",
      );
    } finally {
      setStarting(false);
    }
  };

  const performSubmit = useCallback(
    async (autoSubmit: boolean): Promise<boolean> => {
      if (!testId || submitting) return false;

      try {
        setSubmitting(true);

        const formattedAnswers: LiveTestAnswer[] = Object.entries(
          answersRef.current,
        ).map(([questionId, optionId]) => ({
          question_id: Number(questionId),
          selected_option_id: Number(optionId),
        }));

        const response = await submitLiveTest(testId, formattedAnswers);

        setSubmittedMessage(
          response.message ||
            (autoSubmit
              ? "Time expired. Your live test was auto-submitted."
              : "Your live test was submitted successfully."),
        );

        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );

        return true;
      } catch (error: any) {
        Alert.alert(
          "Submission failed",
          error?.response?.data?.message ||
            error?.message ||
            "Please check your connection and try again.",
        );
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [submitting, testId],
  );

  const confirmSubmit = () => {
    Alert.alert(
      "Submit live test?",
      `${answeredCount} of ${questions.length} questions are answered. You cannot change answers after submission.`,
      [
        { text: "Review", style: "cancel" },
        {
          text: "Submit",
          onPress: () => void performSubmit(false),
        },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <StatusBar style="light" backgroundColor={COLORS.background} />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={COLORS.cyan} />
          <Text style={styles.stateTitle}>Loading live test</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (screenError || !meta) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <StatusBar style="light" backgroundColor={COLORS.background} />
        <View style={styles.centerState}>
          <Ionicons name="warning-outline" size={40} color={COLORS.red} />
          <Text style={styles.stateTitle}>Unable to load live test</Text>
          <Text style={styles.stateDescription}>
            {screenError || "Live test not found."}
          </Text>
          <Pressable onPress={() => void load()} style={styles.retryButton}>
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (submittedMessage) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <StatusBar style="light" backgroundColor={COLORS.background} />
        <View style={styles.centerState}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={58} color={COLORS.green} />
          </View>
          <Text style={styles.submittedTitle}>Live Test Submitted</Text>
          <Text style={styles.stateDescription}>{submittedMessage}</Text>
          <Text style={styles.resultNote}>
            Results will be announced shortly.
          </Text>
          <Pressable onPress={() => router.back()} style={styles.retryButton}>
            <Text style={styles.retryText}>Back to Live Tests</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    const stateColor =
      introState === "live"
        ? COLORS.green
        : introState === "upcoming"
          ? COLORS.amber
          : COLORS.red;

    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <StatusBar style="light" backgroundColor={COLORS.background} />

        <ScrollView
          contentContainerStyle={[
            styles.introContainer,
            {
              paddingHorizontal: horizontalPadding,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.introContent, { maxWidth: contentMaxWidth }]}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={20} color={COLORS.text} />
              <Text style={styles.backText}>Back</Text>
            </Pressable>

            <LinearGradient
              colors={["#172554", "#111B45", "#080E28"]}
              style={styles.introCard}
            >
              <View style={styles.introHeader}>
                <View style={styles.liveIcon}>
                  <Ionicons name="radio-outline" size={27} color={COLORS.cyan} />
                </View>

                <View style={styles.introHeaderText}>
                  <Text style={styles.introTitle}>{meta.title}</Text>
                  <Text style={styles.introDescription}>
                    {meta.description || "Live test instructions and schedule."}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.countdownCard,
                  {
                    borderColor: `${stateColor}45`,
                    backgroundColor: `${stateColor}12`,
                  },
                ]}
              >
                <Text style={styles.countdownLabel}>
                  {introState === "upcoming"
                    ? "Starts In"
                    : introState === "live"
                      ? "Ends In"
                      : "Status"}
                </Text>

                <Text style={[styles.countdownValue, { color: stateColor }]}>
                  {introState === "ended"
                    ? "Live Test Ended"
                    : formatTime(introCountdown)}
                </Text>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Ionicons name="time-outline" size={18} color={COLORS.cyan} />
                  <Text style={styles.infoText}>
                    {meta.duration_minutes} minutes
                  </Text>
                </View>

                <View style={styles.infoItem}>
                  <Ionicons
                    name="help-circle-outline"
                    size={18}
                    color={COLORS.cyan}
                  />
                  <Text style={styles.infoText}>
                    {meta.total_questions} questions
                  </Text>
                </View>
              </View>

              <View style={styles.scheduleCard}>
                <Text style={styles.scheduleText}>
                  Starts: {formatDateTime(meta.start_at)}
                </Text>
                <Text style={styles.scheduleText}>
                  Ends: {formatDateTime(meta.end_at)}
                </Text>
              </View>

              <View style={styles.rulesList}>
                {[
                  "The timer is controlled by the server.",
                  "You cannot start before the scheduled start time.",
                  "The test automatically closes at the scheduled end time.",
                  "The test may auto-submit when the server timer expires.",
                  "Results will be announced after the test.",
                ].map((rule) => (
                  <View key={rule} style={styles.ruleRow}>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={18}
                      color={COLORS.cyan}
                    />
                    <Text style={styles.ruleText}>{rule}</Text>
                  </View>
                ))}
              </View>

              <Pressable
                disabled={starting || introState !== "live"}
                onPress={() => {
                  Alert.alert(
                    "Confirm Start",
                    "Once started, the server timer cannot be paused.",
                    [
                      { text: "Cancel", style: "cancel" },
                      { text: "Start Now", onPress: () => void handleStart() },
                    ],
                  );
                }}
                style={[
                  styles.primaryButton,
                  (starting || introState !== "live") && styles.disabled,
                ]}
              >
                {starting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {introState === "upcoming"
                      ? "Starts Soon"
                      : introState === "ended"
                        ? "Live Test Ended"
                        : "Start Live Test"}
                  </Text>
                )}
              </Pressable>
            </LinearGradient>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>No questions available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar style="light" backgroundColor={COLORS.background} />

      <View style={styles.testScreen}>
        <View style={styles.testHeader}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </Pressable>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>{session.test.title}</Text>
            <Text style={styles.headerSubtitle}>
              Question {currentIndex + 1} of {questions.length}
            </Text>
          </View>

          <Pressable
            onPress={() => setTrackerOpen(true)}
            style={styles.iconButton}
          >
            <Ionicons name="grid-outline" size={21} color={COLORS.cyan} />
          </Pressable>
        </View>

        <View style={styles.metaRow}>
          <View
            style={[
              styles.timerPill,
              { borderColor: `${getTimerColor(timeLeft)}55` },
            ]}
          >
            <Ionicons
              name="time-outline"
              size={16}
              color={getTimerColor(timeLeft)}
            />
            <Text
              style={[
                styles.timerText,
                { color: getTimerColor(timeLeft) },
              ]}
            >
              {formatTime(timeLeft)}
            </Text>
          </View>

          <Text style={styles.answeredText}>{answeredCount} answered</Text>
        </View>

        <View style={styles.progressTrack}>
          <LinearGradient
            colors={[COLORS.cyan, COLORS.blue]}
            style={[styles.progressFill, { width: `${progress}%` }]}
          />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.questionScroll,
            {
              paddingHorizontal: horizontalPadding,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.questionCard, { maxWidth: contentMaxWidth }]}>
            <View style={styles.questionMeta}>
              <Text style={styles.questionNumber}>Q{currentIndex + 1}</Text>
              {currentQuestion.difficulty ? (
                <Text style={styles.difficulty}>
                  {currentQuestion.difficulty}
                </Text>
              ) : null}
            </View>

            <Text style={styles.questionText}>
              {currentQuestion.question_text}
            </Text>

            {currentQuestion.image_url ? (
              <Image
                source={{ uri: currentQuestion.image_url }}
                style={[
                  styles.questionImage,
                  { aspectRatio: isTablet ? 16 / 9 : 4 / 3 },
                ]}
                contentFit="contain"
              />
            ) : null}

            <View style={styles.optionsList}>
              {currentQuestion.options.map((option, index) => (
                <OptionItem
                  key={option.id}
                  option={option}
                  index={index}
                  selected={answers[currentQuestion.id] === option.id}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setAnswers((previous) => {
                      const next = {
                        ...previous,
                        [currentQuestion.id]: option.id,
                      };
                      answersRef.current = next;
                      return next;
                    });
                  }}
                />
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            disabled={currentIndex === 0 || submitting}
            onPress={() => setCurrentIndex((index) => index - 1)}
            style={[styles.footerButton, currentIndex === 0 && styles.disabled]}
          >
            <Ionicons name="chevron-back" size={18} color={COLORS.text} />
            <Text style={styles.footerButtonText}>Previous</Text>
          </Pressable>

          <Text style={styles.footerCounter}>
            {currentIndex + 1}/{questions.length}
          </Text>

          {currentIndex === questions.length - 1 ? (
            <Pressable
              disabled={submitting}
              onPress={confirmSubmit}
              style={styles.submitButton}
            >
              {submitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.submitButtonText}>Submit</Text>
              )}
            </Pressable>
          ) : (
            <Pressable
              disabled={submitting}
              onPress={() => setCurrentIndex((index) => index + 1)}
              style={styles.nextButton}
            >
              <Text style={styles.nextButtonText}>Next</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.white} />
            </Pressable>
          )}
        </View>
      </View>

      <Modal
        visible={trackerOpen}
        animationType="slide"
        presentationStyle={Platform.OS === "ios" ? "pageSheet" : "fullScreen"}
        onRequestClose={() => setTrackerOpen(false)}
      >
        <SafeAreaView style={styles.trackerSafeArea} edges={["top", "bottom"]}>
          <View style={styles.trackerHeader}>
            <View>
              <Text style={styles.trackerTitle}>Question Tracker</Text>
              <Text style={styles.trackerSubtitle}>
                {answeredCount} answered · {questions.length - answeredCount} remaining
              </Text>
            </View>

            <Pressable
              onPress={() => setTrackerOpen(false)}
              style={styles.iconButton}
            >
              <Ionicons name="close" size={23} color={COLORS.text} />
            </Pressable>
          </View>

          <FlatList
            key={trackerColumns}
            data={questions}
            numColumns={trackerColumns}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.trackerGrid}
            renderItem={({ item, index }) => {
              const selected = answers[item.id] !== undefined;
              const activeCell = index === currentIndex;

              return (
                <Pressable
                  onPress={() => {
                    setCurrentIndex(index);
                    setTrackerOpen(false);
                  }}
                  style={[
                    styles.trackerCell,
                    {
                      width:
                        (width - 32 - (trackerColumns - 1) * 9) /
                        trackerColumns,
                    },
                    selected && styles.trackerCellAnswered,
                    activeCell && styles.trackerCellActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.trackerCellText,
                      selected && { color: COLORS.green },
                      activeCell && { color: COLORS.cyan },
                    ]}
                  >
                    {index + 1}
                  </Text>
                </Pressable>
              );
            }}
          />

          <View style={styles.trackerFooter}>
            <Pressable onPress={confirmSubmit} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>
                {submitting ? "Submitting…" : "Submit Live Test"}
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  stateTitle: {
    color: COLORS.white,
    fontSize: 21,
    fontWeight: "900",
    marginTop: 17,
    textAlign: "center",
  },
  submittedTitle: {
    color: COLORS.white,
    fontSize: 25,
    fontWeight: "900",
    marginTop: 18,
    textAlign: "center",
  },
  stateDescription: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 9,
  },
  resultNote: { color: COLORS.text, fontSize: 13, marginTop: 10 },
  successIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(52,211,153,0.10)",
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.cyan,
  },
  retryText: { color: COLORS.background, fontWeight: "900" },
  introContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 22,
  },
  introContent: { width: "100%", alignSelf: "center" },
  backButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 10,
    marginBottom: 12,
  },
  backText: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  introCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  introHeader: { flexDirection: "row", gap: 14, alignItems: "center" },
  liveIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,211,238,0.10)",
  },
  introHeaderText: { flex: 1 },
  introTitle: { color: COLORS.white, fontSize: 22, fontWeight: "900" },
  introDescription: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  countdownCard: {
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  countdownLabel: { color: COLORS.muted, fontSize: 12 },
  countdownValue: {
    fontSize: 26,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
    marginTop: 5,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
    marginTop: 18,
  },
  infoItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  infoText: { color: COLORS.text, fontSize: 13, fontWeight: "700" },
  scheduleCard: {
    gap: 8,
    marginTop: 18,
    padding: 14,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.035)",
  },
  scheduleText: { color: COLORS.text, fontSize: 13 },
  rulesList: { gap: 11, marginVertical: 20 },
  ruleRow: { flexDirection: "row", gap: 9, alignItems: "flex-start" },
  ruleText: { flex: 1, color: COLORS.text, fontSize: 13, lineHeight: 19 },
  primaryButton: {
    minHeight: 50,
    borderRadius: 15,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  primaryButtonText: { color: COLORS.white, fontSize: 14, fontWeight: "900" },
  disabled: { opacity: 0.42 },
  testScreen: { flex: 1, backgroundColor: COLORS.background },
  testHeader: {
    minHeight: 68,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitleWrap: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
  headerTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
  headerSubtitle: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  metaRow: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timerPill: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  timerText: {
    fontSize: 14,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  answeredText: { color: COLORS.muted, fontSize: 12 },
  progressTrack: {
    height: 4,
    marginHorizontal: 16,
    borderRadius: 2,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  progressFill: { height: "100%" },
  questionScroll: {
    flexGrow: 1,
    paddingTop: 16,
    paddingBottom: 28,
  },
  questionCard: {
    width: "100%",
    alignSelf: "center",
    padding: 18,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  questionMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  questionNumber: { color: COLORS.cyan, fontSize: 13, fontWeight: "900" },
  difficulty: {
    color: COLORS.muted,
    fontSize: 11,
    textTransform: "capitalize",
  },
  questionText: {
    color: COLORS.white,
    fontSize: 17,
    lineHeight: 26,
    fontWeight: "600",
  },
  questionImage: {
    width: "100%",
    marginTop: 17,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.025)",
  },
  optionsList: { gap: 11, marginTop: 20 },
  optionCard: {
    minHeight: 64,
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "rgba(255,255,255,0.025)",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  optionCardSelected: {
    borderColor: "rgba(34,211,238,0.48)",
    backgroundColor: "rgba(34,211,238,0.075)",
  },
  optionLabel: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionLabelSelected: {
    backgroundColor: "rgba(34,211,238,0.14)",
    borderColor: "rgba(34,211,238,0.35)",
  },
  optionLabelText: { color: COLORS.muted, fontWeight: "800", fontSize: 13 },
  optionLabelTextSelected: { color: COLORS.cyan },
  optionText: { flex: 1, color: COLORS.text, fontSize: 14, lineHeight: 21 },
  optionTextSelected: { color: COLORS.white },
  pressed: { opacity: 0.82 },
  footer: {
    minHeight: 72,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  footerButton: {
    flex: 1,
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  footerButtonText: { color: COLORS.text, fontWeight: "800" },
  footerCounter: {
    color: COLORS.muted,
    fontSize: 12,
    minWidth: 46,
    textAlign: "center",
  },
  nextButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  nextButtonText: { color: COLORS.white, fontWeight: "900" },
  submitButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: { color: COLORS.white, fontWeight: "900" },
  trackerSafeArea: { flex: 1, backgroundColor: COLORS.panelSoft },
  trackerHeader: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  trackerTitle: { color: COLORS.white, fontSize: 18, fontWeight: "900" },
  trackerSubtitle: { color: COLORS.muted, fontSize: 12, marginTop: 3 },
  trackerGrid: { padding: 16, paddingBottom: 110 },
  trackerCell: {
    aspectRatio: 1,
    marginRight: 9,
    marginBottom: 9,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  trackerCellAnswered: {
    backgroundColor: "rgba(52,211,153,0.09)",
    borderColor: "rgba(52,211,153,0.30)",
  },
  trackerCellActive: {
    backgroundColor: "rgba(34,211,238,0.12)",
    borderColor: COLORS.cyan,
  },
  trackerCellText: { color: COLORS.muted, fontSize: 13, fontWeight: "900" },
  trackerFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: COLORS.panelSoft,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
});
