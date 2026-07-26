import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useNetwork } from "@/providers/NetworkProvider";

type NotificationType = "offline" | "online" | null;

export default function OfflineBanner() {
  const { isOnline, isChecking, refreshNetworkStatus } = useNetwork();

  const insets = useSafeAreaInsets();

  const translateY = useRef(new Animated.Value(-140)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const previousOnlineStatus = useRef<boolean | null>(null);

  const [notificationType, setNotificationType] =
    useState<NotificationType>(null);

  const [isRetrying, setIsRetrying] = useState(false);

  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotification = () => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 18,
        stiffness: 180,
        mass: 0.8,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideNotification = (onComplete?: () => void) => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -140,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete?.();
    });
  };

  useEffect(() => {
    if (isChecking) {
      return;
    }

    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    const previousStatus = previousOnlineStatus.current;

    // Initial network status
    if (previousStatus === null) {
      previousOnlineStatus.current = isOnline;

      if (!isOnline) {
        setNotificationType("offline");

        requestAnimationFrame(() => {
          showNotification();
        });
      }

      return;
    }

    // Device went offline
    if (!isOnline) {
      setNotificationType("offline");

      requestAnimationFrame(() => {
        showNotification();
      });
    }

    // Device came back online
    if (isOnline && previousStatus === false) {
      setNotificationType("online");

      requestAnimationFrame(() => {
        showNotification();
      });

      hideTimerRef.current = setTimeout(() => {
        hideNotification(() => {
          setNotificationType(null);
        });
      }, 2800);
    }

    previousOnlineStatus.current = isOnline;

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [isChecking, isOnline]);

  const handleRetry = async () => {
    if (isRetrying) {
      return;
    }

    setIsRetrying(true);

    try {
      const online = await refreshNetworkStatus();

      if (online) {
        setNotificationType("online");

        hideTimerRef.current = setTimeout(() => {
          hideNotification(() => {
            setNotificationType(null);
          });
        }, 2500);
      }
    } finally {
      setIsRetrying(false);
    }
  };

  if (isChecking || !notificationType) {
    return null;
  }

  const isOfflineNotification = notificationType === "offline";

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          top: Math.max(insets.top + 8, 16),
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View
        style={[
          styles.notification,
          isOfflineNotification
            ? styles.offlineNotification
            : styles.onlineNotification,
        ]}
      >
        <View
          style={[
            styles.iconContainer,
            isOfflineNotification
              ? styles.offlineIconContainer
              : styles.onlineIconContainer,
          ]}
        >
          <Ionicons
            name={
              isOfflineNotification
                ? "cloud-offline-outline"
                : "checkmark-circle-outline"
            }
            size={22}
            color={isOfflineNotification ? "#FBBF24" : "#4ADE80"}
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {isOfflineNotification
              ? "You’re currently offline"
              : "You’re back online"}
          </Text>

          <Text style={styles.description}>
            {isOfflineNotification
              ? "Some features may be unavailable. You can still view content saved on this device."
              : "Your connection has been restored. We’re refreshing the latest content."}
          </Text>
        </View>

        {isOfflineNotification && (
          <Pressable
            disabled={isRetrying}
            onPress={handleRetry}
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.retryButtonPressed,
              isRetrying && styles.retryButtonDisabled,
            ]}
          >
            {isRetrying ? (
              <ActivityIndicator size="small" color="#0F172A" />
            ) : (
              <>
                <Ionicons name="refresh" size={15} color="#0F172A" />

                <Text style={styles.retryButtonText}>Retry</Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 30,
  },

  notification: {
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: 12,
    borderWidth: 1,
    borderRadius: 18,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.28,
    shadowRadius: 14,
  },

  offlineNotification: {
    backgroundColor: "#1C1917",
    borderColor: "rgba(251, 191, 36, 0.35)",
  },

  onlineNotification: {
    backgroundColor: "#052E22",
    borderColor: "rgba(74, 222, 128, 0.35)",
  },

  iconContainer: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
  },

  offlineIconContainer: {
    backgroundColor: "rgba(251, 191, 36, 0.12)",
  },

  onlineIconContainer: {
    backgroundColor: "rgba(74, 222, 128, 0.12)",
  },

  textContainer: {
    flex: 1,
    marginHorizontal: 12,
  },

  title: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 19,
  },

  description: {
    marginTop: 3,
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 17,
  },

  retryButton: {
    minWidth: 67,
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 10,
    borderRadius: 11,
    backgroundColor: "#FBBF24",
  },

  retryButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },

  retryButtonDisabled: {
    opacity: 0.65,
  },

  retryButtonText: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "800",
  },
});
