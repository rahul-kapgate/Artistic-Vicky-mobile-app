import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Pdf from "react-native-pdf";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  deleteTemporaryResourcePdf,
  downloadResourcePdf,
} from "@/services/resource-pdf.service";

const COLORS = {
  background: "#050A1C",
  viewerBackground: "#0A1024",
  surface: "#0D1633",
  surfaceSoft: "rgba(255,255,255,0.05)",
  white: "#FFFFFF",
  text: "#EAF0FF",
  muted: "#9BA7C2",
  mutedDark: "#6F7B98",
  cyan: "#4CC3FF",
  cyanBright: "#33D6FF",
  cyanSoft: "rgba(76,195,255,0.11)",
  cyanBorder: "rgba(76,195,255,0.21)",
  danger: "#FB7185",
  border: "rgba(255,255,255,0.08)",
};

function getParam(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isValidResourceId(resourceId?: string): resourceId is string {
  return Boolean(resourceId && /^\d+$/.test(resourceId.trim()));
}

function PageProgress({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const progress =
    totalPages > 0 ? Math.min(Math.max(currentPage / totalPages, 0), 1) : 0;

  return (
    <View style={styles.pageProgressTrack}>
      <View
        style={[
          styles.pageProgressValue,
          {
            width: `${progress * 100}%`,
          },
        ]}
      />
    </View>
  );
}

export default function ResourceViewerScreen() {
  const { width, height } = useWindowDimensions();

  const params = useLocalSearchParams<{
    id?: string | string[];
    title?: string | string[];
    retry?: string | string[];
  }>();

  const retryKey = getParam(params.retry);
  const resourceId = getParam(params.id);
  const resourceTitle = getParam(params.title)?.trim() || "Resource PDF";

  const isLandscape = width > height;

  const [localPdfUri, setLocalPdfUri] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(true);
  const [isRotating, setIsRotating] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const mountedRef = useRef(true);
  const closingRef = useRef(false);
  const downloadedUriRef = useRef<string | null>(null);

  const pageLabel = useMemo(() => {
    if (totalPages <= 0) {
      return "PDF Viewer";
    }

    return `Page ${currentPage} of ${totalPages}`;
  }, [currentPage, totalPages]);

  const restorePortrait = useCallback(async () => {
    try {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      );
    } catch (error) {
      console.warn("Unable to restore portrait orientation:", error);
    }
  }, []);

  const closeViewer = useCallback(() => {
    if (closingRef.current) {
      return;
    }

    closingRef.current = true;
    setLocalPdfUri(null);

    void restorePortrait().finally(() => {
      requestAnimationFrame(() => {
        router.back();
      });
    });
  }, [restorePortrait]);

  const toggleOrientation = useCallback(async () => {
    if (isRotating) {
      return;
    }

    try {
      setIsRotating(true);

      await ScreenOrientation.lockAsync(
        isLandscape
          ? ScreenOrientation.OrientationLock.PORTRAIT_UP
          : ScreenOrientation.OrientationLock.LANDSCAPE,
      );
    } catch (error) {
      console.error("Unable to rotate PDF viewer:", error);
    } finally {
      if (mountedRef.current) {
        setIsRotating(false);
      }
    }
  }, [isLandscape, isRotating]);

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
      setCurrentPage(1);
      setTotalPages(0);

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

      if (downloadedUri) {
        setTimeout(() => {
          void deleteTemporaryResourcePdf(downloadedUri);
        }, 350);
      }

      void restorePortrait();
    };
  }, [resourceId, retryKey, restorePortrait]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "background") {
        closeViewer();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [closeViewer]);

  const retryDownload = useCallback(() => {
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
    <SafeAreaView
      style={styles.safeArea}
      edges={isLandscape ? ["left", "right"] : ["top", "bottom"]}
    >
      <StatusBar
        style="light"
        hidden={isLandscape}
        backgroundColor={COLORS.background}
      />

      <View style={[styles.header, isLandscape && styles.headerLandscape]}>
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
          <Ionicons
            name={isLandscape ? "contract-outline" : "close"}
            size={22}
            color={COLORS.white}
          />
        </Pressable>

        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <View style={styles.pdfBadge}>
              <Text style={styles.pdfBadgeText}>PDF</Text>
            </View>

            <Text style={styles.headerTitle} numberOfLines={1}>
              {resourceTitle}
            </Text>
          </View>

          <Text style={styles.headerSubtitle}>{pageLabel}</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            isLandscape
              ? "Rotate PDF viewer to portrait"
              : "Rotate PDF viewer to landscape"
          }
          hitSlop={10}
          disabled={isRotating}
          onPress={() => void toggleOrientation()}
          style={({ pressed }) => [
            styles.headerButton,
            styles.rotateHeaderButton,
            pressed && styles.pressed,
            isRotating && styles.disabled,
          ]}
        >
          {isRotating ? (
            <ActivityIndicator size="small" color={COLORS.cyan} />
          ) : (
            <Ionicons
              name="phone-landscape-outline"
              size={21}
              color={COLORS.cyan}
            />
          )}
        </Pressable>
      </View>

      <PageProgress currentPage={currentPage} totalPages={totalPages} />

      <View style={styles.viewerContainer}>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />

        {isDownloading ? (
          <View style={styles.centerState}>
            <View style={styles.loadingIcon}>
              <ActivityIndicator size="large" color={COLORS.cyan} />
            </View>

            <Text style={styles.stateTitle}>Preparing your resource</Text>

            <Text style={styles.stateDescription}>
              Downloading the PDF securely and preparing it for reading.
            </Text>

            <View style={styles.loadingSteps}>
              <View style={styles.loadingStep}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={16}
                  color={COLORS.cyan}
                />

                <Text style={styles.loadingStepText}>Secure download</Text>
              </View>

              <View style={styles.loadingDot} />

              <View style={styles.loadingStep}>
                <Ionicons
                  name="document-text-outline"
                  size={16}
                  color={COLORS.cyan}
                />

                <Text style={styles.loadingStepText}>PDF rendering</Text>
              </View>
            </View>
          </View>
        ) : errorMessage ? (
          <View style={styles.centerState}>
            <View style={styles.errorIcon}>
              <Ionicons
                name="warning-outline"
                size={36}
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
                  size={18}
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
            spacing={isLandscape ? 12 : 8}
            minScale={1}
            maxScale={5}
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

        {!isDownloading && !errorMessage && localPdfUri ? (
          <View
            pointerEvents="box-none"
            style={[
              styles.floatingToolbarContainer,
              isLandscape && styles.floatingToolbarContainerLandscape,
            ]}
          >
            <View style={styles.floatingToolbar}>
              <View style={styles.pagePill}>
                <Ionicons
                  name="document-text-outline"
                  size={15}
                  color={COLORS.cyan}
                />

                <Text style={styles.pagePillText}>
                  {totalPages > 0
                    ? `${currentPage} / ${totalPages}`
                    : "Loading"}
                </Text>
              </View>

              <View style={styles.toolbarDivider} />

              <View style={styles.zoomHint}>
                <Ionicons
                  name="expand-outline"
                  size={15}
                  color={COLORS.muted}
                />

                <Text style={styles.zoomHintText}>Pinch to zoom</Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Rotate PDF viewer"
                disabled={isRotating}
                onPress={() => void toggleOrientation()}
                style={({ pressed }) => [
                  styles.rotateButton,
                  pressed && styles.pressed,
                  isRotating && styles.disabled,
                ]}
              >
                {isRotating ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons
                      name="phone-landscape-outline"
                      size={17}
                      color={COLORS.white}
                    />

                    {!isLandscape ? (
                      <Text style={styles.rotateButtonText}>Rotate</Text>
                    ) : null}
                  </>
                )}
              </Pressable>
            </View>
          </View>
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
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    backgroundColor: COLORS.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },

  headerLandscape: {
    minHeight: 56,
    paddingHorizontal: 12,
  },

  headerButton: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  rotateHeaderButton: {
    backgroundColor: COLORS.cyanSoft,
    borderColor: COLORS.cyanBorder,
  },

  headerContent: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 10,
  },

  titleRow: {
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
  },

  pdfBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 7,
    backgroundColor: "rgba(251,113,133,0.12)",
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.2)",
  },

  pdfBadgeText: {
    color: COLORS.danger,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  headerTitle: {
    flexShrink: 1,
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },

  headerSubtitle: {
    color: COLORS.mutedDark,
    fontSize: 10,
    fontWeight: "600",
    marginTop: 4,
  },

  pageProgressTrack: {
    height: 3,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  pageProgressValue: {
    height: "100%",
    backgroundColor: COLORS.cyan,
  },

  viewerContainer: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
    backgroundColor: COLORS.viewerBackground,
  },

  glowTop: {
    position: "absolute",
    top: -170,
    right: -170,
    width: 380,
    height: 380,
    borderRadius: 380,
    backgroundColor: "rgba(37,99,235,0.08)",
  },

  glowBottom: {
    position: "absolute",
    bottom: -180,
    left: -180,
    width: 420,
    height: 420,
    borderRadius: 420,
    backgroundColor: "rgba(168,85,247,0.06)",
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
  },

  loadingIcon: {
    width: 78,
    height: 78,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.cyanSoft,
    borderWidth: 1,
    borderColor: COLORS.cyanBorder,
  },

  errorIcon: {
    width: 78,
    height: 78,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(251,113,133,0.1)",
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.2)",
  },

  stateTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 18,
  },

  stateDescription: {
    maxWidth: 430,
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
  },

  loadingSteps: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 21,
  },

  loadingStep: {
    flexDirection: "row",
    alignItems: "center",
  },

  loadingStepText: {
    color: COLORS.muted,
    fontSize: 10,
    marginLeft: 6,
  },

  loadingDot: {
    width: 3,
    height: 3,
    borderRadius: 3,
    marginHorizontal: 10,
    backgroundColor: COLORS.mutedDark,
  },

  primaryButton: {
    minHeight: 45,
    paddingHorizontal: 19,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 21,
    backgroundColor: COLORS.cyan,
  },

  primaryButtonText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: "900",
  },

  secondaryButton: {
    minHeight: 41,
    paddingHorizontal: 17,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 9,
  },

  secondaryButtonText: {
    color: COLORS.cyan,
    fontSize: 13,
    fontWeight: "800",
  },

  floatingToolbarContainer: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
    alignItems: "center",
  },

  floatingToolbarContainerLandscape: {
    left: 20,
    right: 20,
    bottom: 10,
  },

  floatingToolbar: {
    minHeight: 52,
    maxWidth: 520,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    borderRadius: 18,
    backgroundColor: "rgba(5,10,28,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
  },

  pagePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
  },

  pagePillText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "800",
    marginLeft: 6,
    fontVariant: ["tabular-nums"],
  },

  toolbarDivider: {
    width: 1,
    height: 25,
    marginHorizontal: 6,
    backgroundColor: COLORS.border,
  },

  zoomHint: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
  },

  zoomHintText: {
    color: COLORS.muted,
    fontSize: 10,
    marginLeft: 6,
  },

  rotateButton: {
    minWidth: 45,
    height: 38,
    paddingHorizontal: 11,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
  },

  rotateButtonText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "800",
    marginLeft: 6,
  },

  pressed: {
    opacity: 0.7,
  },

  disabled: {
    opacity: 0.48,
  },
});
