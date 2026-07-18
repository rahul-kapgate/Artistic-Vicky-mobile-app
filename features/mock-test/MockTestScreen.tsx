import { Ionicons } from "@expo/vector-icons";
import { usePreventRemove } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useNavigation } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useMockTestSession } from "@/features/mock-test/useMockTestSession";
import type {
  MockTestOption,
  MockTestQuestion,
  MockTestType,
  SubmitTestResponse,
} from "@/types/mock-test";

const COLORS = {
  background: "#07090f",
  panel: "#0c1020",
  panelSoft: "#0a0e1a",
  white: "#f8fafc",
  text: "#d1d5db",
  muted: "#7c8597",
  border: "rgba(255,255,255,0.08)",
  cyan: "#22d3ee",
  blue: "#2563eb",
  green: "#34d399",
  amber: "#fbbf24",
  red: "#f87171",
};

const WHATSAPP_NUMBER = "919325217691";
const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

const SMALL_PHONE_BREAKPOINT = 360;
const TABLET_BREAKPOINT = 768;
const QUESTION_CONTENT_MAX_WIDTH = 760;
const RULES_CONTENT_MAX_WIDTH = 680;
const RESULT_CONTENT_MAX_WIDTH = 620;
const TRACKER_CONTENT_MAX_WIDTH = 760;

function getHorizontalPadding(width: number): number {
  if (width < SMALL_PHONE_BREAKPOINT) return 12;
  if (width >= TABLET_BREAKPOINT) return 24;
  return 16;
}

function getTrackerColumnCount(width: number): number {
  if (width < SMALL_PHONE_BREAKPOINT) return 4;
  if (width < 600) return 5;
  if (width < 900) return 7;
  return 8;
}

interface MockTestScreenProps {
  type: MockTestType;
  resourceId: string;
  showPromo?: boolean;
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return [hours, minutes, remainingSeconds]
    .map((value) => value.toString().padStart(2, "0"))
    .join(":");
}

function getTimerColor(timeLeft: number) {
  if (timeLeft <= 300) return COLORS.red;
  if (timeLeft <= 900) return COLORS.amber;
  return COLORS.cyan;
}

function AppButton({
  title,
  onPress,
  disabled = false,
  variant = "primary",
  icon,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const content = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "secondary" && styles.buttonSecondary,
        variant === "danger" && styles.buttonDanger,
        variant === "ghost" && styles.buttonGhost,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={17}
          color={variant === "ghost" ? COLORS.text : COLORS.white}
        />
      ) : null}
      <Text
        style={[
          styles.buttonText,
          variant === "ghost" && styles.buttonGhostText,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );

  if (variant !== "primary") return content;

  return (
    <LinearGradient
      colors={[COLORS.cyan, COLORS.blue]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.buttonGradient}
    >
      {content}
    </LinearGradient>
  );
}

function TimerPill({ timeLeft }: { timeLeft: number }) {
  const color = getTimerColor(timeLeft);

  return (
    <View style={[styles.timerPill, { borderColor: `${color}55` }]}>
      <Ionicons name="time-outline" size={16} color={color} />
      <Text style={[styles.timerText, { color }]}>{formatTime(timeLeft)}</Text>
    </View>
  );
}

function LoadingScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color={COLORS.cyan} />
        <Text style={styles.stateTitle}>Loading test</Text>
        <Text style={styles.stateDescription}>
          Preparing your questions and saved progress…
        </Text>
      </View>
    </SafeAreaView>
  );
}

function ErrorScreen({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.centerState}>
        <View style={styles.errorIcon}>
          <Ionicons name="warning-outline" size={30} color={COLORS.red} />
        </View>
        <Text style={styles.stateTitle}>Unable to load test</Text>
        <Text style={styles.stateDescription}>{message}</Text>
        <View style={styles.stateAction}>
          <AppButton title="Try Again" onPress={onRetry} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function RulesScreen({
  type,
  questionCount,
  onStart,
}: {
  type: MockTestType;
  questionCount: number;
  onStart: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const horizontalPadding = getHorizontalPadding(width);
  const label = type === "mock" ? "Mock Test" : "PYQ Test";
  const rules = [
    ["time-outline", "You have 60 minutes to complete the test."],
    ["stats-chart-outline", "Each question carries equal marks."],
    ["book-outline", "You can review and change answers before submitting."],
    [
      "phone-portrait-outline",
      "Your progress is saved if the app goes to background.",
    ],
    ["wifi-outline", "Use a stable internet connection when submitting."],
  ] as const;

  const confirmStart = () => {
    Alert.alert(
      "Ready to begin?",
      "The 60-minute timer starts immediately and cannot be paused.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start Now",
          onPress: () => {
            void Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            );
            onStart();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#08111b", COLORS.background, COLORS.background]}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.rulesContainer,
            {
              paddingHorizontal: horizontalPadding,
              paddingTop: height < 700 ? 10 : 16,
              paddingBottom: height < 700 ? 22 : 36,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.text} />
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>

          <View style={styles.rulesCard}>
            <View style={styles.rulesHeader}>
              <View style={styles.infoIcon}>
                <Ionicons
                  name="information-circle-outline"
                  size={27}
                  color={COLORS.cyan}
                />
              </View>
              <View style={styles.flex}>
                <Text style={styles.rulesTitle}>{label}</Text>
                <Text style={styles.rulesSubtitle}>
                  {questionCount} questions · 60 minutes
                </Text>
              </View>
            </View>

            <View style={styles.rulesList}>
              {rules.map(([icon, text]) => (
                <View key={text} style={styles.ruleRow}>
                  <Ionicons name={icon} size={19} color={COLORS.cyan} />
                  <Text style={styles.ruleText}>{text}</Text>
                </View>
              ))}
            </View>

            <AppButton
              title="Start Test"
              icon="play-outline"
              onPress={confirmStart}
              disabled={questionCount === 0}
            />
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

function OptionItem({
  option,
  index,
  selected,
  onSelect,
}: {
  option: MockTestOption;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onSelect}
      style={({ pressed }) => [
        styles.optionCard,
        selected && styles.optionCardSelected,
        pressed && styles.optionCardPressed,
      ]}
    >
      <View
        style={[styles.optionLabel, selected && styles.optionLabelSelected]}
      >
        <Text
          style={[
            styles.optionLabelText,
            selected && styles.optionLabelTextSelected,
          ]}
        >
          {OPTION_LABELS[index] ?? String(index + 1)}
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

function QuestionTrackerModal({
  visible,
  questions,
  answers,
  currentIndex,
  timeLeft,
  submitting,
  onClose,
  onJump,
  onSubmit,
}: {
  visible: boolean;
  questions: MockTestQuestion[];
  answers: Record<number, number>;
  currentIndex: number;
  timeLeft: number;
  submitting: boolean;
  onClose: () => void;
  onJump: (index: number) => void;
  onSubmit: () => void;
}) {
  const { width } = useWindowDimensions();
  const answeredCount = Object.keys(answers).length;
  const trackerColumns = getTrackerColumnCount(width);
  const trackerGap = width < SMALL_PHONE_BREAKPOINT ? 7 : 9;
  const trackerHorizontalPadding = getHorizontalPadding(width);
  const trackerContentWidth =
    Math.min(width, TRACKER_CONTENT_MAX_WIDTH) - trackerHorizontalPadding * 2;
  const trackerCellSize = Math.floor(
    (trackerContentWidth - trackerGap * (trackerColumns - 1)) / trackerColumns,
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === "ios" ? "pageSheet" : "fullScreen"}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.trackerSafeArea} edges={["top", "bottom"]}>
        <View style={styles.trackerHeader}>
          <View>
            <Text style={styles.trackerTitle}>Question Tracker</Text>
            <Text style={styles.trackerSubtitle}>
              {answeredCount} answered · {questions.length - answeredCount}{" "}
              remaining
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close tracker"
            onPress={onClose}
            style={styles.iconButton}
          >
            <Ionicons name="close" size={23} color={COLORS.text} />
          </Pressable>
        </View>

        <View style={styles.trackerTimerRow}>
          <TimerPill timeLeft={timeLeft} />
        </View>

        <FlatList
          key={`tracker-${trackerColumns}`}
          data={questions}
          keyExtractor={(item) => String(item.id)}
          numColumns={trackerColumns}
          style={styles.trackerList}
          contentContainerStyle={[
            styles.trackerGrid,
            { paddingHorizontal: trackerHorizontalPadding },
          ]}
          columnWrapperStyle={[styles.trackerColumn, { gap: trackerGap }]}
          renderItem={({ item, index }) => {
            const answered = answers[item.id] !== undefined;
            const active = index === currentIndex;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Question ${index + 1}${answered ? ", answered" : ""}`}
                onPress={() => onJump(index)}
                style={[
                  styles.trackerCell,
                  {
                    width: trackerCellSize,
                    height: trackerCellSize,
                    maxWidth: trackerCellSize,
                  },
                  answered && styles.trackerCellAnswered,
                  active && styles.trackerCellActive,
                ]}
              >
                <Text
                  style={[
                    styles.trackerCellText,
                    answered && styles.trackerCellTextAnswered,
                    active && styles.trackerCellTextActive,
                  ]}
                >
                  {index + 1}
                </Text>
              </Pressable>
            );
          }}
        />

        <View style={styles.trackerFooter}>
          <AppButton
            title={submitting ? "Submitting…" : "Submit Test"}
            icon="checkmark-done-outline"
            disabled={submitting}
            onPress={onSubmit}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function ResultScreen({
  type,
  result,
  showPromo,
}: {
  type: MockTestType;
  result: SubmitTestResponse;
  showPromo: boolean;
}) {
  const { width, height } = useWindowDimensions();
  const horizontalPadding = getHorizontalPadding(width);
  const percentage = result.totalQuestions
    ? Math.round((result.score / result.totalQuestions) * 100)
    : 0;
  const label = type === "mock" ? "Mock" : "PYQ";

  const resultColor =
    percentage >= 70
      ? COLORS.green
      : percentage >= 40
        ? COLORS.amber
        : COLORS.red;

  const openWhatsApp = async (message: string) => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Unable to open WhatsApp", "Please try again later.");
    }
  };

  const courseMessage = `Hi, I completed the free mock test and scored ${result.score}/${result.totalQuestions}. I am interested in the MAH AAC CET Entrance Exam Preparation Course. Please share the details.`;
  const paidMockMessage = `Hi, I completed the free mock test and scored ${result.score}/${result.totalQuestions}. I am interested in the paid mock test for better evaluation. Please share the details.`;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={[
          styles.resultContainer,
          {
            paddingHorizontal: horizontalPadding,
            paddingVertical: height < 700 ? 18 : 30,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.resultCard}>
          <View style={styles.trophyCircle}>
            <Ionicons name="trophy-outline" size={36} color={COLORS.amber} />
          </View>

          <Text style={styles.resultTitle}>{label} Test Completed!</Text>
          <Text style={styles.resultSubtitle}>{result.message}</Text>

          <View style={[styles.scoreCircle, { borderColor: resultColor }]}>
            <Text style={styles.scorePercentage}>{percentage}%</Text>
            <Text style={styles.scoreFraction}>
              {result.score}/{result.totalQuestions}
            </Text>
          </View>

          <Text style={styles.resultFeedback}>
            {percentage >= 70
              ? "Excellent work! Keep it up."
              : percentage >= 40
                ? "Good effort! Keep improving."
                : "Keep practicing — you will get there!"}
          </Text>

          {showPromo ? (
            <View style={styles.promoCard}>
              <Text style={styles.promoTitle}>Level up your preparation</Text>
              <Text style={styles.promoText}>
                Join the BFA Entrance Exam Preparation Course for live classes,
                video lectures, e-books, mock tests, and more.
              </Text>
              <View style={styles.promoActions}>
                <AppButton
                  title="Join Full Course"
                  icon="logo-whatsapp"
                  onPress={() => void openWhatsApp(courseMessage)}
                />
                <AppButton
                  title="Try Paid Mock Test"
                  variant="secondary"
                  onPress={() => void openWhatsApp(paidMockMessage)}
                />
              </View>
            </View>
          ) : null}

          <View style={styles.resultActions}>
            <AppButton
              title="Back to Tests"
              variant="secondary"
              icon="arrow-back"
              onPress={() => router.replace("/(app)/course/mock-tests")}
            />
            <AppButton
              title="View Profile"
              icon="person-outline"
              onPress={() => router.push("/(app)/profile")}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function MockTestScreen({
  type,
  resourceId,
  showPromo = false,
}: MockTestScreenProps) {
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();
  const horizontalPadding = getHorizontalPadding(width);
  const isSmallPhone = width < SMALL_PHONE_BREAKPOINT;
  const isTablet = width >= TABLET_BREAKPOINT;
  const [trackerOpen, setTrackerOpen] = useState(false);
  const [canLeave, setCanLeave] = useState(false);
  const pendingNavigationAction = useRef<unknown>(null);

  const session = useMockTestSession({ type, resourceId });

  const testIsActive = session.testStarted && !session.result;

  usePreventRemove(testIsActive && !canLeave, ({ data }) => {
    Alert.alert(
      "Leave test?",
      "Leaving will submit your current answers and end this attempt.",
      [
        { text: "Stay", style: "cancel" },
        {
          text: "Exit & Submit",
          style: "destructive",
          onPress: () => {
            void (async () => {
              const outcome = await session.submit({ allowEmpty: true });
              if (!outcome.ok) {
                Alert.alert(
                  "Submission failed",
                  outcome.error ||
                    "Your progress is saved. Check your connection and try again.",
                );
                return;
              }

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

    const frame = requestAnimationFrame(() => {
      navigation.dispatch(action as never);
    });

    return () => cancelAnimationFrame(frame);
  }, [canLeave, navigation]);

  const currentQuestion = session.currentQuestion;
  const currentIsLast =
    session.currentIndex === Math.max(0, session.questions.length - 1);

  const timerColor = getTimerColor(session.timeLeft);

  const handleSelect = (questionId: number, optionId: number) => {
    void Haptics.selectionAsync();
    session.selectAnswer(questionId, optionId);
  };

  const handleManualSubmit = () => {
    if (session.answeredCount === 0 && session.timeLeft > 0) {
      Alert.alert(
        "No answers selected",
        "Attempt at least one question first.",
      );
      return;
    }

    Alert.alert(
      "Submit test?",
      `${session.answeredCount} of ${session.questions.length} questions are answered. You cannot change answers after submission.`,
      [
        { text: "Review", style: "cancel" },
        {
          text: "Submit",
          onPress: () => {
            setTrackerOpen(false);
            void (async () => {
              const outcome = await session.submit({
                allowEmpty: session.timeLeft === 0,
              });

              if (outcome.ok) {
                void Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                );
              } else {
                Alert.alert(
                  "Submission failed",
                  outcome.error || "Please try again.",
                );
              }
            })();
          },
        },
      ],
    );
  };

  const title = type === "mock" ? "Mock Test" : "PYQ Test";

  if (session.questionsLoading) return <LoadingScreen />;

  if (session.questionsError) {
    return (
      <ErrorScreen
        message={session.questionsError}
        onRetry={() => void session.retryQuestions()}
      />
    );
  }

  if (!session.testStarted && !session.result) {
    return (
      <RulesScreen
        type={type}
        questionCount={session.questions.length}
        onStart={session.startTest}
      />
    );
  }

  if (session.result) {
    return (
      <ResultScreen type={type} result={session.result} showPromo={showPromo} />
    );
  }

  if (!currentQuestion) {
    return (
      <ErrorScreen
        message="No questions are available for this test."
        onRetry={() => void session.retryQuestions()}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.testScreen}>
        <View
          style={[styles.testHeader, { paddingHorizontal: horizontalPadding }]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Leave test"
            onPress={() => router.back()}
            style={styles.iconButton}
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </Pressable>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>{title}</Text>
            <Text style={styles.headerSubtitle}>
              Question {session.currentIndex + 1} of {session.questions.length}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open question tracker"
            onPress={() => setTrackerOpen(true)}
            style={styles.iconButton}
          >
            <Ionicons name="grid-outline" size={21} color={COLORS.cyan} />
          </Pressable>
        </View>

        <View
          style={[styles.testMetaRow, { paddingHorizontal: horizontalPadding }]}
        >
          <TimerPill timeLeft={session.timeLeft} />
          <Text style={styles.answeredText}>
            {session.answeredCount} answered
          </Text>
        </View>

        <View
          style={[
            styles.progressTrack,
            { marginHorizontal: horizontalPadding },
          ]}
        >
          <LinearGradient
            colors={[COLORS.cyan, COLORS.blue]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${session.progress}%` }]}
          />
        </View>

        {session.timeLeft === 0 || session.submitError ? (
          <View
            style={[
              styles.submitBanner,
              { marginHorizontal: horizontalPadding },
            ]}
          >
            <Ionicons
              name={
                session.submitError ? "warning-outline" : "cloud-upload-outline"
              }
              size={18}
              color={session.submitError ? COLORS.red : timerColor}
            />
            <Text style={styles.submitBannerText}>
              {session.submitError
                ? session.submitError
                : "Time is over. Submitting your answers…"}
            </Text>
            {session.submitError ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => void session.submit({ allowEmpty: true })}
              >
                <Text style={styles.retrySubmitText}>Retry</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <ScrollView
          contentContainerStyle={[
            styles.questionScrollContent,
            {
              paddingHorizontal: horizontalPadding,
              paddingTop: height < 650 ? 10 : 16,
              paddingBottom: height < 650 ? 16 : 28,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.questionCard,
              {
                maxWidth: QUESTION_CONTENT_MAX_WIDTH,
                padding: isSmallPhone ? 14 : isTablet ? 24 : 18,
              },
            ]}
          >
            <View style={styles.questionMeta}>
              <Text style={styles.questionNumber}>
                Q{session.currentIndex + 1}
              </Text>
              {currentQuestion.difficulty ? (
                <Text style={styles.difficultyText}>
                  {currentQuestion.difficulty}
                </Text>
              ) : null}
            </View>

            <Text
              style={[
                styles.questionText,
                {
                  fontSize: isSmallPhone ? 15 : isTablet ? 19 : 17,
                  lineHeight: isSmallPhone ? 23 : isTablet ? 29 : 26,
                },
              ]}
            >
              {currentQuestion.question_text}
            </Text>

            {currentQuestion.image_url ? (
              <Image
                source={{ uri: currentQuestion.image_url }}
                style={[
                  styles.questionImage,
                  {
                    aspectRatio: isTablet ? 16 / 9 : 4 / 3,
                    maxHeight: isTablet ? 420 : 320,
                  },
                ]}
                contentFit="contain"
                transition={200}
                accessibilityLabel="Question illustration"
              />
            ) : null}

            <View style={styles.optionsList}>
              {currentQuestion.options.map((option, index) => (
                <OptionItem
                  key={option.id}
                  option={option}
                  index={index}
                  selected={session.answers[currentQuestion.id] === option.id}
                  onSelect={() => handleSelect(currentQuestion.id, option.id)}
                />
              ))}
            </View>
          </View>
        </ScrollView>

        <View
          style={[
            styles.navigationFooter,
            {
              paddingHorizontal: isSmallPhone ? 8 : 12,
              paddingVertical: height < 650 ? 7 : 10,
            },
          ]}
        >
          <View
            style={[
              styles.navigationFooterInner,
              { maxWidth: QUESTION_CONTENT_MAX_WIDTH },
            ]}
          >
            <View style={styles.footerButtonWrap}>
              <AppButton
                title="Previous"
                icon="chevron-back"
                variant="ghost"
                disabled={session.currentIndex === 0 || session.submitting}
                onPress={session.goPrevious}
              />
            </View>

            <Text style={styles.footerCounter}>
              {session.currentIndex + 1}/{session.questions.length}
            </Text>

            <View style={styles.footerButtonWrap}>
              {currentIsLast ? (
                <AppButton
                  title={session.submitting ? "Submitting…" : "Submit"}
                  icon="checkmark-done-outline"
                  disabled={session.submitting}
                  onPress={handleManualSubmit}
                />
              ) : (
                <AppButton
                  title="Next"
                  icon="chevron-forward"
                  variant="secondary"
                  disabled={session.submitting}
                  onPress={session.goNext}
                />
              )}
            </View>
          </View>
        </View>
      </View>

      <QuestionTrackerModal
        visible={trackerOpen}
        questions={session.questions}
        answers={session.answers}
        currentIndex={session.currentIndex}
        timeLeft={session.timeLeft}
        submitting={session.submitting}
        onClose={() => setTrackerOpen(false)}
        onJump={(index) => {
          session.jumpToQuestion(index);
          setTrackerOpen(false);
        }}
        onSubmit={handleManualSubmit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  testScreen: { flex: 1, backgroundColor: COLORS.background },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  stateTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "700",
    marginTop: 18,
  },
  stateDescription: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 8,
  },
  stateAction: { width: "100%", maxWidth: 260, marginTop: 24 },
  errorIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(248,113,113,0.10)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.22)",
  },
  buttonGradient: { width: "100%", borderRadius: 14, overflow: "hidden" },
  button: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 17,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  buttonSecondary: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  buttonDanger: { backgroundColor: "rgba(239,68,68,0.88)" },
  buttonGhost: { backgroundColor: "transparent" },
  buttonDisabled: { opacity: 0.42 },
  buttonPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  buttonText: { color: COLORS.white, fontSize: 14, fontWeight: "700" },
  buttonGhostText: { color: COLORS.text },
  timerPill: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.025)",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  timerText: {
    fontSize: 14,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  rulesContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: {
    width: "100%",
    maxWidth: RULES_CONTENT_MAX_WIDTH,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 10,
    marginBottom: 20,
  },
  backButtonText: { color: COLORS.text, fontSize: 14, fontWeight: "600" },
  rulesCard: {
    width: "100%",
    maxWidth: RULES_CONTENT_MAX_WIDTH,
    alignSelf: "center",
    padding: 22,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rulesHeader: { flexDirection: "row", alignItems: "center", gap: 14 },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,211,238,0.08)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.18)",
  },
  rulesTitle: { color: COLORS.white, fontSize: 23, fontWeight: "800" },
  rulesSubtitle: { color: COLORS.muted, fontSize: 13, marginTop: 3 },
  rulesList: { gap: 10, marginVertical: 25 },
  ruleRow: {
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(255,255,255,0.018)",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  ruleText: { flex: 1, color: COLORS.text, fontSize: 14, lineHeight: 20 },
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
  optionCardPressed: { opacity: 0.84 },
  optionLabel: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
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
  trackerSafeArea: { flex: 1, backgroundColor: COLORS.panelSoft },
  trackerHeader: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  trackerTitle: { color: COLORS.white, fontSize: 18, fontWeight: "800" },
  trackerSubtitle: { color: COLORS.muted, fontSize: 12, marginTop: 3 },
  trackerTimerRow: { alignItems: "center", paddingVertical: 14 },
  trackerList: {
    width: "100%",
    maxWidth: TRACKER_CONTENT_MAX_WIDTH,
    alignSelf: "center",
  },
  trackerGrid: { paddingVertical: 16, paddingBottom: 110 },
  trackerColumn: { marginBottom: 9, justifyContent: "flex-start" },
  trackerCell: {
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
  trackerCellText: { color: COLORS.muted, fontSize: 13, fontWeight: "800" },
  trackerCellTextAnswered: { color: COLORS.green },
  trackerCellTextActive: { color: COLORS.cyan },
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
  resultContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  resultCard: {
    width: "100%",
    maxWidth: RESULT_CONTENT_MAX_WIDTH,
    alignSelf: "center",
    padding: 22,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  trophyCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(251,191,36,0.09)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.22)",
  },
  resultTitle: {
    color: COLORS.white,
    fontSize: 23,
    fontWeight: "800",
    marginTop: 18,
    textAlign: "center",
  },
  resultSubtitle: {
    color: COLORS.muted,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    marginTop: 6,
  },
  scoreCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 9,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 24,
    backgroundColor: "rgba(255,255,255,0.018)",
  },
  scorePercentage: { color: COLORS.white, fontSize: 28, fontWeight: "900" },
  scoreFraction: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  resultFeedback: { color: COLORS.text, fontSize: 14, marginBottom: 20 },
  promoCard: {
    width: "100%",
    padding: 17,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "rgba(255,255,255,0.022)",
    marginBottom: 18,
  },
  promoTitle: { color: COLORS.white, fontSize: 16, fontWeight: "800" },
  promoText: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
  },
  promoActions: { gap: 10, marginTop: 15 },
  resultActions: { width: "100%", gap: 10 },
  testHeader: {
    minHeight: 68,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  headerTitleWrap: { flex: 1, alignItems: "center" },
  headerTitle: { color: COLORS.white, fontSize: 15, fontWeight: "800" },
  headerSubtitle: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  testMetaRow: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  answeredText: { color: COLORS.muted, fontSize: 12 },
  progressTrack: {
    height: 4,
    marginHorizontal: 16,
    borderRadius: 2,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  progressFill: { height: "100%", borderRadius: 2 },
  submitBanner: {
    marginHorizontal: 16,
    marginTop: 11,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  submitBannerText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 17,
  },
  retrySubmitText: { color: COLORS.cyan, fontSize: 12, fontWeight: "800" },
  questionScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
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
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  questionNumber: { color: COLORS.cyan, fontSize: 13, fontWeight: "900" },
  difficultyText: {
    color: COLORS.muted,
    fontSize: 11,
    textTransform: "capitalize",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  questionText: {
    color: COLORS.white,
    fontSize: 17,
    lineHeight: 26,
    fontWeight: "600",
  },
  questionImage: {
    width: "100%",
    borderRadius: 15,
    marginTop: 17,
    backgroundColor: "rgba(255,255,255,0.025)",
  },
  optionsList: { gap: 11, marginTop: 20 },
  navigationFooter: {
    minHeight: 72,
    backgroundColor: COLORS.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    alignItems: "center",
  },
  navigationFooterInner: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  footerButtonWrap: { flex: 1, minWidth: 0 },
  footerCounter: {
    color: COLORS.muted,
    fontSize: 12,
    minWidth: 46,
    textAlign: "center",
  },
});
