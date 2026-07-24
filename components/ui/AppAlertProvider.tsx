import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, {
    ComponentProps,
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export type AppAlertTone = "info" | "success" | "warning" | "danger";

export type AppAlertButtonStyle = "default" | "cancel" | "destructive";

export interface AppAlertButton {
  text: string;
  style?: AppAlertButtonStyle;
  onPress?: () => void | Promise<void>;
}

export interface AppAlertOptions {
  tone?: AppAlertTone;
  icon?: IoniconName;
  cancelable?: boolean;
  onDismiss?: () => void;
}

interface AlertState {
  title: string;
  message?: string;
  buttons: AppAlertButton[];
  options: AppAlertOptions;
}

interface AppAlertContextValue {
  alert: (
    title: string,
    message?: string,
    buttons?: AppAlertButton[],
    options?: AppAlertOptions,
  ) => void;

  hideAlert: () => void;
}

interface AppAlertProviderProps {
  children: ReactNode;
}

const AppAlertContext = createContext<AppAlertContextValue | null>(null);

const TONE_CONFIG: Record<
  AppAlertTone,
  {
    icon: IoniconName;
    color: string;
    iconBackground: string;
    borderColor: string;
  }
> = {
  info: {
    icon: "information-circle-outline",
    color: "#4CC3FF",
    iconBackground: "rgba(76,195,255,0.12)",
    borderColor: "rgba(76,195,255,0.22)",
  },

  success: {
    icon: "checkmark-circle-outline",
    color: "#34D399",
    iconBackground: "rgba(52,211,153,0.12)",
    borderColor: "rgba(52,211,153,0.22)",
  },

  warning: {
    icon: "warning-outline",
    color: "#FBBF24",
    iconBackground: "rgba(251,191,36,0.12)",
    borderColor: "rgba(251,191,36,0.22)",
  },

  danger: {
    icon: "alert-circle-outline",
    color: "#FB7185",
    iconBackground: "rgba(251,113,133,0.12)",
    borderColor: "rgba(251,113,133,0.22)",
  },
};

export function useAppAlert(): AppAlertContextValue {
  const context = useContext(AppAlertContext);

  if (!context) {
    throw new Error("useAppAlert must be used inside AppAlertProvider.");
  }

  return context;
}

export default function AppAlertProvider({ children }: AppAlertProviderProps) {
  const [currentAlert, setCurrentAlert] = useState<AlertState | null>(null);

  const alert = useCallback(
    (
      title: string,
      message = "",
      buttons: AppAlertButton[] = [
        {
          text: "OK",
          style: "default",
        },
      ],
      options: AppAlertOptions = {},
    ) => {
      const normalizedButtons =
        buttons.length > 0
          ? buttons
          : [
              {
                text: "OK",
                style: "default" as const,
              },
            ];

      setCurrentAlert({
        title,
        message,
        buttons: normalizedButtons,
        options: {
          tone: options.tone ?? "info",
          icon: options.icon,
          cancelable: options.cancelable ?? false,
          onDismiss: options.onDismiss,
        },
      });
    },
    [],
  );

  const hideAlert = useCallback(() => {
    setCurrentAlert(null);
  }, []);

  const handleDismiss = useCallback(() => {
    if (!currentAlert?.options.cancelable) {
      return;
    }

    const onDismiss = currentAlert.options.onDismiss;

    setCurrentAlert(null);

    if (onDismiss) {
      requestAnimationFrame(() => {
        onDismiss();
      });
    }
  }, [currentAlert]);

  const handleButtonPress = useCallback((button: AppAlertButton) => {
    const onPress = button.onPress;

    setCurrentAlert(null);

    if (!onPress) {
      return;
    }

    requestAnimationFrame(() => {
      Promise.resolve(onPress()).catch((error) => {
        console.error("Custom alert action failed:", error);
      });
    });
  }, []);

  const contextValue = useMemo(
    () => ({
      alert,
      hideAlert,
    }),
    [alert, hideAlert],
  );

  const tone = currentAlert?.options.tone ?? "info";

  const toneConfig = TONE_CONFIG[tone];

  const alertIcon = currentAlert?.options.icon ?? toneConfig.icon;

  const useVerticalButtons = (currentAlert?.buttons.length ?? 0) > 2;

  return (
    <AppAlertContext.Provider value={contextValue}>
      {children}

      <Modal
        visible={Boolean(currentAlert)}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={handleDismiss}
      >
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} />

          {currentAlert ? (
            <View
              style={[
                styles.card,
                {
                  borderColor: toneConfig.borderColor,
                },
              ]}
            >
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: toneConfig.iconBackground,
                    borderColor: toneConfig.borderColor,
                  },
                ]}
              >
                <Ionicons name={alertIcon} size={30} color={toneConfig.color} />
              </View>

              <Text style={styles.title}>{currentAlert.title}</Text>

              {currentAlert.message ? (
                <Text style={styles.message}>{currentAlert.message}</Text>
              ) : null}

              <View
                style={[
                  styles.actions,
                  useVerticalButtons && styles.actionsVertical,
                ]}
              >
                {currentAlert.buttons.map((button, index) => {
                  const buttonStyle = button.style ?? "default";

                  const isCancel = buttonStyle === "cancel";

                  const isDestructive = buttonStyle === "destructive";

                  if (buttonStyle === "default") {
                    return (
                      <LinearGradient
                        key={`${button.text}-${index}`}
                        colors={["#22D3EE", "#2563EB"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[
                          styles.buttonGradient,
                          useVerticalButtons && styles.verticalButton,
                        ]}
                      >
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => handleButtonPress(button)}
                          style={({ pressed }) => [
                            styles.button,
                            pressed && styles.buttonPressed,
                          ]}
                        >
                          <Text style={styles.defaultButtonText}>
                            {button.text}
                          </Text>
                        </Pressable>
                      </LinearGradient>
                    );
                  }

                  return (
                    <Pressable
                      key={`${button.text}-${index}`}
                      accessibilityRole="button"
                      onPress={() => handleButtonPress(button)}
                      style={({ pressed }) => [
                        styles.button,
                        styles.secondaryButton,
                        isDestructive && styles.destructiveButton,
                        useVerticalButtons && styles.verticalButton,
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.secondaryButtonText,
                          isCancel && styles.cancelButtonText,
                          isDestructive && styles.destructiveButtonText,
                        ]}
                      >
                        {button.text}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}
        </View>
      </Modal>
    </AppAlertContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.72)",
  },

  card: {
    width: "100%",
    maxWidth: 410,
    padding: 22,
    borderRadius: 26,
    alignItems: "center",
    borderWidth: 1,
    backgroundColor: "#10172D",
    shadowColor: "#000000",
    shadowOpacity: 0.45,
    shadowRadius: 30,
    elevation: 18,
  },

  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  title: {
    marginTop: 17,
    color: "#FFFFFF",
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "900",
    textAlign: "center",
  },

  message: {
    marginTop: 9,
    color: "#AAB4CC",
    fontSize: 13,
    lineHeight: 21,
    textAlign: "center",
  },

  actions: {
    width: "100%",
    marginTop: 22,
    flexDirection: "row",
    gap: 10,
  },

  actionsVertical: {
    flexDirection: "column",
  },

  buttonGradient: {
    flex: 1,
    minHeight: 49,
    borderRadius: 15,
    overflow: "hidden",
  },

  button: {
    flex: 1,
    minHeight: 49,
    paddingHorizontal: 15,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryButton: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  destructiveButton: {
    borderColor: "rgba(251,113,133,0.25)",
    backgroundColor: "rgba(251,113,133,0.12)",
  },

  verticalButton: {
    width: "100%",
    flex: 0,
  },

  defaultButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  secondaryButtonText: {
    color: "#D8DEED",
    fontSize: 14,
    fontWeight: "800",
  },

  cancelButtonText: {
    color: "#AAB4CC",
  },

  destructiveButtonText: {
    color: "#FDA4AF",
  },

  buttonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
});
