import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Pdf from "react-native-pdf";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  deleteTemporaryResourcePdf,
  downloadResourcePdf,
} from "@/services/resource-pdf.service";

const COLORS = {
  background: "#0A0F1E",
  viewerBackground: "#111827",
  card: "rgba(255,255,255,0.05)",
  white: "#FFFFFF",
  muted: "#9CA3AF",
  mutedDark: "#6B7280",
  cyan: "#22D3EE",
  danger: "#FB7185",
  border: "rgba(255,255,255,0.08)",
};

function getParam(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isValidResourceId(resourceId?: string): resourceId is string {
  return Boolean(resourceId && /^\d+$/.test(resourceId.trim()));
}

export default function ResourceViewerScreen() {
  const params = useLocalSearchParams<{
    id?: string | string[];
    title?: string | string[];
    retry?: string | string[];
  }>();

  const retryKey = getParam(params.retry);

  const resourceId = getParam(params.id);
  const resourceTitle = getParam(params.title)?.trim() || "Resource PDF";

  const [localPdfUri, setLocalPdfUri] = useState<string | null>(null);

  const [isDownloading, setIsDownloading] = useState(true);

  const [downloadError, setDownloadError] = useState<string | null>(null);

  const [renderError, setRenderError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);

  const [totalPages, setTotalPages] = useState(0);

  const mountedRef = useRef(true);
  const closingRef = useRef(false);
  const downloadedUriRef = useRef<string | null>(null);

  const closeViewer = useCallback(() => {
    if (closingRef.current) {
      return;
    }

    closingRef.current = true;

    /*
     * Remove the native PDF component before starting the route
     * transition. This reduces native cleanup race conditions.
     */
    setLocalPdfUri(null);

    requestAnimationFrame(() => {
      router.back();
    });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    closingRef.current = false;

    let cancelled = false;

    async function preparePdf() {
      if (!isValidResourceId(resourceId)) {
        setDownloadError("The resource ID is missing or invalid.");
        setIsDownloading(false);
        return;
      }

      setIsDownloading(true);
      setDownloadError(null);
      setRenderError(null);

      try {
        const downloadedUri = await downloadResourcePdf(resourceId);

        if (cancelled || !mountedRef.current) {
          await deleteTemporaryResourcePdf(downloadedUri);
          return;
        }

        downloadedUriRef.current = downloadedUri;

        setLocalPdfUri(downloadedUri);
      } catch (error) {
        if (cancelled || !mountedRef.current) {
          return;
        }

        console.error("Resource PDF download failed:", error);

        setDownloadError(
          error instanceof Error
            ? error.message
            : "Unable to download this PDF.",
        );
      } finally {
        if (!cancelled && mountedRef.current) {
          setIsDownloading(false);
        }
      }
    }

    void preparePdf();

    return () => {
      cancelled = true;
      mountedRef.current = false;

      const downloadedUri = downloadedUriRef.current;

      downloadedUriRef.current = null;

      /*
       * Give react-native-pdf time to release the native file
       * handle before removing the downloaded file.
       */
      if (downloadedUri) {
        setTimeout(() => {
          void deleteTemporaryResourcePdf(downloadedUri);
        }, 350);
      }
    };
  }, [resourceId, retryKey]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      /*
       * Do not close on "inactive", because opening the
       * notification centre can briefly trigger it.
       */
      if (nextState === "background") {
        closeViewer();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [closeViewer]);

  const retryDownload = useCallback(() => {
    /*
     * Replacing with the same route gives the screen a fresh
     * download lifecycle.
     */
    router.replace({
      pathname: "/(app)/course/resource-viewer",
      params: {
        id: resourceId ?? "",
        title: resourceTitle,
        retry: String(Date.now()),
      },
    } as never);
  }, [resourceId, resourceTitle]);

  const errorMessage = downloadError ?? renderError;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar style="light" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close PDF viewer"
          hitSlop={10}
          onPress={closeViewer}
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="close" size={23} color={COLORS.white} />
        </Pressable>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {resourceTitle}
          </Text>

          <Text style={styles.headerSubtitle}>
            {totalPages > 0
              ? `Page ${currentPage} of ${totalPages}`
              : "PDF Viewer"}
          </Text>
        </View>

        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.viewerContainer}>
        {isDownloading ? (
          <View style={styles.centerState}>
            <View style={styles.loadingIcon}>
              <ActivityIndicator size="large" color={COLORS.cyan} />
            </View>

            <Text style={styles.stateTitle}>Preparing resource</Text>

            <Text style={styles.stateDescription}>
              Downloading the PDF securely…
            </Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.centerState}>
            <View style={styles.errorIcon}>
              <Ionicons
                name="warning-outline"
                size={34}
                color={COLORS.danger}
              />
            </View>

            <Text style={styles.stateTitle}>Unable to open PDF</Text>

            <Text style={styles.stateDescription}>{errorMessage}</Text>

            {downloadError ? (
              <Pressable
                accessibilityRole="button"
                onPress={retryDownload}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name="refresh-outline"
                  size={17}
                  color={COLORS.background}
                />

                <Text style={styles.primaryButtonText}>Try Again</Text>
              </Pressable>
            ) : null}

            <Pressable
              accessibilityRole="button"
              onPress={closeViewer}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.secondaryButtonText}>Close Viewer</Text>
            </Pressable>
          </View>
        ) : localPdfUri ? (
          <Pdf
            key={localPdfUri}
            source={{
              uri: localPdfUri,
              cache: false,
            }}
            style={styles.pdf}
            horizontal={false}
            enablePaging={false}
            enableAntialiasing
            enableAnnotationRendering
            spacing={8}
            minScale={1}
            maxScale={4}
            fitPolicy={0}
            renderActivityIndicator={() => (
              <View style={styles.pdfLoading}>
                <ActivityIndicator size="large" color={COLORS.cyan} />

                <Text style={styles.pdfLoadingText}>Rendering PDF…</Text>
              </View>
            )}
            onLoadComplete={(numberOfPages) => {
              if (!mountedRef.current) {
                return;
              }

              setTotalPages(numberOfPages);
              setCurrentPage(1);
              setRenderError(null);
            }}
            onPageChanged={(page, numberOfPages) => {
              if (!mountedRef.current) {
                return;
              }

              setCurrentPage(page);
              setTotalPages(numberOfPages);
            }}
            onError={(error) => {
              console.error("PDF rendering failed:", error);

              if (!mountedRef.current) {
                return;
              }

              setRenderError(
                error instanceof Error
                  ? error.message
                  : "The downloaded file could not be rendered.",
              );
            }}
            onPressLink={(uri) => {
              console.log("PDF link pressed:", uri);
            }}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    backgroundColor: COLORS.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  headerContent: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 12,
  },

  headerTitle: {
    maxWidth: "100%",
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },

  headerSubtitle: {
    color: COLORS.mutedDark,
    fontSize: 10,
    fontWeight: "600",
    marginTop: 3,
  },

  headerSpacer: {
    width: 42,
    height: 42,
  },

  viewerContainer: {
    flex: 1,
    backgroundColor: COLORS.viewerBackground,
  },

  pdf: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.viewerBackground,
  },

  pdfLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: COLORS.viewerBackground,
  },

  pdfLoadingText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "600",
  },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    backgroundColor: COLORS.background,
  },

  loadingIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,211,238,0.08)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.18)",
  },

  errorIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(251,113,133,0.10)",
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.20)",
  },

  stateTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 17,
  },

  stateDescription: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
  },

  primaryButton: {
    minHeight: 43,
    paddingHorizontal: 19,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 20,
    backgroundColor: COLORS.cyan,
  },

  primaryButtonText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: "800",
  },

  secondaryButton: {
    minHeight: 40,
    paddingHorizontal: 17,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 9,
  },

  secondaryButtonText: {
    color: COLORS.cyan,
    fontSize: 13,
    fontWeight: "700",
  },

  pressed: {
    opacity: 0.7,
  },
});
