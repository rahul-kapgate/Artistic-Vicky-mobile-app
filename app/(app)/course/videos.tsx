import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    useWindowDimensions,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import YoutubePlayer, {
    type YoutubeIframeRef,
} from "react-native-youtube-iframe";

import { getVideoSections } from "@/services/video.service";
import type { VideoLecture, VideoSection } from "@/types/video";

const COLORS = {
  background: "#07090F",
  surface: "#0C0F18",
  surfaceSoft: "rgba(255,255,255,0.035)",
  surfacePressed: "rgba(255,255,255,0.065)",
  white: "#FFFFFF",
  text: "#E5E7EB",
  muted: "#9CA3AF",
  mutedDark: "#6B7280",
  cyan: "#22D3EE",
  cyanSoft: "rgba(34,211,238,0.09)",
  cyanBorder: "rgba(34,211,238,0.20)",
  green: "#34D399",
  danger: "#FB7185",
  border: "rgba(255,255,255,0.06)",
  borderStrong: "rgba(255,255,255,0.12)",
};

const YOUTUBE_PATTERNS = [
  /youtu\.be\/([0-9A-Za-z_-]{11})/,
  /[?&]v=([0-9A-Za-z_-]{11})/,
  /\/embed\/([0-9A-Za-z_-]{11})/,
  /\/shorts\/([0-9A-Za-z_-]{11})/,
  /\/live\/([0-9A-Za-z_-]{11})/,
];

function extractYouTubeVideoId(youtubeUrl?: string | null): string | null {
  if (!youtubeUrl) {
    return null;
  }

  const trimmedUrl = youtubeUrl.trim();

  if (/^[0-9A-Za-z_-]{11}$/.test(trimmedUrl)) {
    return trimmedUrl;
  }

  for (const pattern of YOUTUBE_PATTERNS) {
    const match = trimmedUrl.match(pattern);

    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

function formatDuration(duration?: number | null): string {
  if (typeof duration !== "number" || duration <= 0) {
    return "Duration unavailable";
  }

  if (duration < 60) {
    return `${duration} min`;
  }

  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

function formatDate(dateValue?: string): string {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getAllVideos(sections: VideoSection[]): VideoLecture[] {
  return sections.flatMap((section) => section.video_lectures ?? []);
}

function PlayerSkeleton({ height }: { height: number }) {
  return (
    <View style={[styles.playerSkeleton, { height }]}>
      <ActivityIndicator size="large" color={COLORS.cyan} />

      <Text style={styles.playerSkeletonText}>Loading video lectures…</Text>
    </View>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.centerState}>
      <View style={styles.errorIcon}>
        <Ionicons name="warning-outline" size={34} color={COLORS.danger} />
      </View>

      <Text style={styles.stateTitle}>Unable to load videos</Text>

      <Text style={styles.stateDescription}>{message}</Text>

      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
      >
        <Ionicons name="refresh-outline" size={17} color={COLORS.background} />

        <Text style={styles.retryButtonText}>Try Again</Text>
      </Pressable>
    </View>
  );
}

function EmptyPlayer({ message = "No video selected." }: { message?: string }) {
  return (
    <View style={styles.emptyPlayer}>
      <View style={styles.emptyPlayerIcon}>
        <Ionicons
          name="videocam-off-outline"
          size={34}
          color={COLORS.mutedDark}
        />
      </View>

      <Text style={styles.emptyPlayerTitle}>No video available</Text>

      <Text style={styles.emptyPlayerText}>{message}</Text>
    </View>
  );
}

function VideoRow({
  video,
  index,
  active,
  onPress,
}: {
  video: VideoLecture;
  index: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`Play ${video.title}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.videoRow,
        active && styles.videoRowActive,
        pressed && styles.videoRowPressed,
      ]}
    >
      <View style={[styles.videoNumber, active && styles.videoNumberActive]}>
        {active ? (
          <Ionicons name="volume-high-outline" size={14} color={COLORS.cyan} />
        ) : (
          <Text style={styles.videoNumberText}>{index + 1}</Text>
        )}
      </View>

      <View style={styles.videoRowContent}>
        <Text
          numberOfLines={2}
          style={[styles.videoRowTitle, active && styles.videoRowTitleActive]}
        >
          {video.title}
        </Text>

        <View style={styles.videoRowMetadata}>
          <Ionicons name="time-outline" size={12} color={COLORS.mutedDark} />

          <Text style={styles.videoRowDuration}>
            {formatDuration(video.duration)}
          </Text>

          {video.is_free ? (
            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>Free</Text>
            </View>
          ) : null}
        </View>
      </View>

      <Ionicons
        name={active ? "checkmark-circle" : "play-circle-outline"}
        size={20}
        color={active ? COLORS.cyan : COLORS.mutedDark}
      />
    </Pressable>
  );
}

function SectionCard({
  section,
  expanded,
  selectedVideoId,
  searchActive,
  onToggle,
  onSelectVideo,
}: {
  section: VideoSection;
  expanded: boolean;
  selectedVideoId: number | null;
  searchActive: boolean;
  onToggle: () => void;
  onSelectVideo: (video: VideoLecture) => void;
}) {
  const lectures = section.video_lectures ?? [];

  const totalDuration = lectures.reduce(
    (total, video) => total + (video.duration ?? 0),
    0,
  );

  const shouldShowLectures = expanded || searchActive;

  return (
    <View style={styles.sectionCard}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{
          expanded: shouldShowLectures,
        }}
        onPress={onToggle}
        style={({ pressed }) => [
          styles.sectionHeader,
          pressed && styles.sectionHeaderPressed,
        ]}
      >
        <View style={styles.sectionIcon}>
          <Ionicons name="albums-outline" size={19} color={COLORS.cyan} />
        </View>

        <View style={styles.sectionHeaderContent}>
          <Text numberOfLines={1} style={styles.sectionTitle}>
            {section.title}
          </Text>

          <Text style={styles.sectionMetadata}>
            {lectures.length} {lectures.length === 1 ? "lecture" : "lectures"}
            {totalDuration > 0 ? ` · ${formatDuration(totalDuration)}` : ""}
          </Text>
        </View>

        <Ionicons
          name={shouldShowLectures ? "chevron-up" : "chevron-down"}
          size={18}
          color={COLORS.muted}
        />
      </Pressable>

      {shouldShowLectures ? (
        <View style={styles.sectionLectures}>
          {lectures.length === 0 ? (
            <Text style={styles.noVideosText}>No videos in this section.</Text>
          ) : (
            lectures.map((video, index) => (
              <VideoRow
                key={video.id}
                video={video}
                index={index}
                active={selectedVideoId === video.id}
                onPress={() => onSelectVideo(video)}
              />
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}

export default function VideoLecturesScreen() {
  const { width } = useWindowDimensions();

  const playerRef = useRef<YoutubeIframeRef | null>(null);

  const [currentVideo, setCurrentVideo] = useState<VideoLecture | null>(null);

  const [playing, setPlaying] = useState(false);

  const [search, setSearch] = useState("");

  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set(),
  );

  const contentWidth = Math.min(Math.max(width - 32, 0), 860);

  const playerHeight = Math.max(Math.round(contentWidth * (9 / 16)), 210);

  const {
    data: sections = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["video-sections", 1],

    queryFn: getVideoSections,

    staleTime: 5 * 60 * 1000,

    retry: 2,
  });

  const allVideos = useMemo(() => getAllVideos(sections), [sections]);

  const selectedVideo = useMemo(() => {
    if (currentVideo) {
      return currentVideo;
    }

    return allVideos[0] ?? null;
  }, [allVideos, currentVideo]);

  const videoId = useMemo(
    () => extractYouTubeVideoId(selectedVideo?.youtube_url),
    [selectedVideo?.youtube_url],
  );

  const currentIndex = useMemo(() => {
    if (!selectedVideo) {
      return -1;
    }

    return allVideos.findIndex((video) => video.id === selectedVideo.id);
  }, [allVideos, selectedVideo]);

  const canGoPrevious = currentIndex > 0;

  const canGoNext = currentIndex >= 0 && currentIndex < allVideos.length - 1;

  const totalDuration = useMemo(
    () => allVideos.reduce((total, video) => total + (video.duration ?? 0), 0),
    [allVideos],
  );

  const filteredSections = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return sections;
    }

    return sections
      .map((section) => {
        const sectionMatches =
          section.title.toLowerCase().includes(normalizedSearch) ||
          section.description?.toLowerCase().includes(normalizedSearch);

        const matchingVideos = (section.video_lectures ?? []).filter(
          (video) => {
            return (
              video.title.toLowerCase().includes(normalizedSearch) ||
              video.description?.toLowerCase().includes(normalizedSearch)
            );
          },
        );

        return {
          ...section,
          video_lectures: sectionMatches
            ? section.video_lectures
            : matchingVideos,
        };
      })
      .filter((section) => (section.video_lectures?.length ?? 0) > 0);
  }, [search, sections]);

  const toggleSection = useCallback((sectionId: number) => {
    setExpandedSections((currentSections) => {
      const updatedSections = new Set(currentSections);

      if (updatedSections.has(sectionId)) {
        updatedSections.delete(sectionId);
      } else {
        updatedSections.add(sectionId);
      }

      return updatedSections;
    });
  }, []);

  const selectVideo = useCallback((video: VideoLecture) => {
    setPlaying(false);
    setCurrentVideo(video);
  }, []);

  const goPrevious = useCallback(() => {
    if (!canGoPrevious) {
      return;
    }

    setPlaying(false);

    setCurrentVideo(allVideos[currentIndex - 1]);
  }, [allVideos, canGoPrevious, currentIndex]);

  const goNext = useCallback(() => {
    if (!canGoNext) {
      return;
    }

    setPlaying(false);

    setCurrentVideo(allVideos[currentIndex + 1]);
  }, [allVideos, canGoNext, currentIndex]);

  const handlePlayerStateChange = useCallback(
    (state: string) => {
      if (state === "ended" && canGoNext) {
        goNext();
        return;
      }

      if (state === "paused" || state === "ended") {
        setPlaying(false);
      }

      if (state === "playing") {
        setPlaying(true);
      }
    },
    [canGoNext, goNext],
  );

  const searchActive = search.trim().length > 0;

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <StatusBar style="light" backgroundColor={COLORS.background} />

        <ErrorState
          message={
            error instanceof Error
              ? error.message
              : "Network error while loading video lectures."
          }
          onRetry={() => void refetch()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar style="light" backgroundColor={COLORS.background} />

      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <View
        style={[
          styles.screen,
          {
            width: contentWidth,
          },
        ]}
      >
        <View style={styles.navigationHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={10}
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.navigationButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="arrow-back" size={21} color={COLORS.white} />
          </Pressable>

          <View style={styles.navigationTitle}>
            <Text style={styles.headerTitle}>Video Lectures</Text>

            <Text style={styles.headerSubtitle}>
              {sections.length} {sections.length === 1 ? "section" : "sections"}{" "}
              · {allVideos.length}{" "}
              {allVideos.length === 1 ? "lecture" : "lectures"}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh videos"
            hitSlop={10}
            disabled={isRefetching}
            onPress={() => void refetch()}
            style={({ pressed }) => [
              styles.navigationButton,
              pressed && styles.pressed,
              isRefetching && styles.disabled,
            ]}
          >
            {isRefetching ? (
              <ActivityIndicator size="small" color={COLORS.cyan} />
            ) : (
              <Ionicons name="refresh-outline" size={20} color={COLORS.cyan} />
            )}
          </Pressable>
        </View>

        <FlatList
          data={filteredSections}
          keyExtractor={(section) => String(section.id)}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor={COLORS.cyan}
              colors={[COLORS.cyan]}
              progressBackgroundColor={COLORS.surface}
            />
          }
          ListHeaderComponent={
            <>
              <View style={styles.playerCard}>
                {isLoading ? (
                  <PlayerSkeleton height={playerHeight} />
                ) : selectedVideo && videoId ? (
                  <View
                    style={[
                      styles.playerContainer,
                      {
                        height: playerHeight,
                      },
                    ]}
                  >
                    <YoutubePlayer
                      ref={playerRef}
                      key={videoId}
                      height={playerHeight}
                      width={contentWidth}
                      videoId={videoId}
                      play={playing}
                      onChangeState={handlePlayerStateChange}
                      forceAndroidAutoplay={false}
                      webViewStyle={styles.youtubeWebView}
                      webViewProps={{
                        allowsFullscreenVideo: true,
                        mediaPlaybackRequiresUserAction: false,
                        allowsInlineMediaPlayback: true,
                        javaScriptEnabled: true,
                        domStorageEnabled: true,
                        scrollEnabled: false,
                        bounces: false,
                      }}
                      initialPlayerParams={{
                        controls: true,
                        preventFullScreen: false,
                        rel: false,
                        loop: false,
                      }}
                    />
                  </View>
                ) : (
                  <EmptyPlayer
                    message={
                      selectedVideo && !videoId
                        ? "The selected lecture has an invalid YouTube URL."
                        : "No video lectures are currently available."
                    }
                  />
                )}

                {!isLoading && selectedVideo ? (
                  <View style={styles.videoInformation}>
                    <Text style={styles.nowPlaying}>Now Playing</Text>

                    <Text style={styles.currentVideoTitle}>
                      {selectedVideo.title}
                    </Text>

                    {selectedVideo.description ? (
                      <Text
                        numberOfLines={3}
                        style={styles.currentVideoDescription}
                      >
                        {selectedVideo.description}
                      </Text>
                    ) : null}

                    <View style={styles.currentVideoMetadata}>
                      <View style={styles.metadataItem}>
                        <Ionicons
                          name="time-outline"
                          size={14}
                          color={COLORS.mutedDark}
                        />

                        <Text style={styles.metadataText}>
                          {formatDuration(selectedVideo.duration)}
                        </Text>
                      </View>

                      {formatDate(selectedVideo.created_at) ? (
                        <View style={styles.metadataItem}>
                          <Ionicons
                            name="calendar-outline"
                            size={14}
                            color={COLORS.mutedDark}
                          />

                          <Text style={styles.metadataText}>
                            {formatDate(selectedVideo.created_at)}
                          </Text>
                        </View>
                      ) : null}

                      {selectedVideo.is_free ? (
                        <View style={styles.freePreviewBadge}>
                          <Text style={styles.freePreviewText}>
                            Free Preview
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.videoControls}>
                      <Pressable
                        accessibilityRole="button"
                        disabled={!canGoPrevious}
                        onPress={goPrevious}
                        style={({ pressed }) => [
                          styles.controlButton,
                          !canGoPrevious && styles.controlButtonDisabled,
                          pressed && canGoPrevious && styles.pressed,
                        ]}
                      >
                        <Ionicons
                          name="play-skip-back"
                          size={16}
                          color={COLORS.text}
                        />

                        <Text style={styles.controlButtonText}>Previous</Text>
                      </Pressable>

                      <Text style={styles.videoPosition}>
                        {currentIndex + 1} of {allVideos.length}
                      </Text>

                      <Pressable
                        accessibilityRole="button"
                        disabled={!canGoNext}
                        onPress={goNext}
                        style={({ pressed }) => [
                          styles.controlButton,
                          !canGoNext && styles.controlButtonDisabled,
                          pressed && canGoNext && styles.pressed,
                        ]}
                      >
                        <Text style={styles.controlButtonText}>Next</Text>

                        <Ionicons
                          name="play-skip-forward"
                          size={16}
                          color={COLORS.text}
                        />
                      </Pressable>
                    </View>
                  </View>
                ) : null}
              </View>

              <View style={styles.contentHeading}>
                <View>
                  <Text style={styles.contentTitle}>Course Content</Text>

                  <Text style={styles.contentSubtitle}>
                    {totalDuration > 0
                      ? `${formatDuration(totalDuration)} total`
                      : "Select a lecture to begin"}
                  </Text>
                </View>

                <View style={styles.contentCount}>
                  <Ionicons name="list-outline" size={15} color={COLORS.cyan} />

                  <Text style={styles.contentCountText}>
                    {allVideos.length}
                  </Text>
                </View>
              </View>

              <View style={styles.searchContainer}>
                <Ionicons
                  name="search-outline"
                  size={18}
                  color={COLORS.mutedDark}
                />

                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search lectures…"
                  placeholderTextColor={COLORS.mutedDark}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  style={styles.searchInput}
                />

                {search.length > 0 ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Clear search"
                    hitSlop={8}
                    onPress={() => setSearch("")}
                    style={({ pressed }) => [
                      styles.clearSearchButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Ionicons name="close" size={18} color={COLORS.muted} />
                  </Pressable>
                ) : null}
              </View>

              {isLoading ? (
                <View style={styles.sectionLoading}>
                  <ActivityIndicator size="small" color={COLORS.cyan} />

                  <Text style={styles.sectionLoadingText}>
                    Loading course content…
                  </Text>
                </View>
              ) : null}
            </>
          }
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptySections}>
                <Ionicons
                  name="search-outline"
                  size={30}
                  color={COLORS.mutedDark}
                />

                <Text style={styles.emptySectionsTitle}>No lectures found</Text>

                <Text style={styles.emptySectionsText}>
                  {search
                    ? `No results for "${search}".`
                    : "No video sections are currently available."}
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <SectionCard
              section={item}
              expanded={expandedSections.has(item.id)}
              selectedVideoId={selectedVideo?.id ?? null}
              searchActive={searchActive}
              onToggle={() => toggleSection(item.id)}
              onSelectVideo={selectVideo}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  screen: {
    flex: 1,
    alignSelf: "center",
    paddingHorizontal: 16,
  },

  glowTop: {
    position: "absolute",
    top: -160,
    right: -160,
    width: 390,
    height: 390,
    borderRadius: 390,
    backgroundColor: "rgba(37,99,235,0.06)",
  },

  glowBottom: {
    position: "absolute",
    bottom: -180,
    left: -180,
    width: 430,
    height: 430,
    borderRadius: 430,
    backgroundColor: "rgba(79,70,229,0.05)",
  },

  navigationHeader: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  navigationButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  navigationTitle: {
    flex: 1,
    alignItems: "center",
  },

  headerTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: COLORS.mutedDark,
    fontSize: 10,
    fontWeight: "600",
    marginTop: 3,
  },

  listContent: {
    paddingBottom: 40,
  },

  playerCard: {
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 8,
  },

  playerContainer: {
    overflow: "hidden",
    backgroundColor: "#000000",
  },

  youtubeWebView: {
    backgroundColor: "#000000",
  },

  playerSkeleton: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#090B10",
  },

  playerSkeletonText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "600",
  },

  emptyPlayer: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
    backgroundColor: "#090B10",
  },

  emptyPlayerIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  emptyPlayerTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 14,
  },

  emptyPlayerText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 6,
  },

  videoInformation: {
    padding: 17,
  },

  nowPlaying: {
    color: COLORS.cyan,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.7,
    textTransform: "uppercase",
  },

  currentVideoTitle: {
    color: COLORS.white,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    marginTop: 6,
  },

  currentVideoDescription: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },

  currentVideoMetadata: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 13,
    marginTop: 14,
  },

  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  metadataText: {
    color: COLORS.mutedDark,
    fontSize: 11,
  },

  freePreviewBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(52,211,153,0.08)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.25)",
  },

  freePreviewText: {
    color: COLORS.green,
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  videoControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingTop: 14,
    marginTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },

  controlButton: {
    minHeight: 38,
    paddingHorizontal: 11,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  controlButtonDisabled: {
    opacity: 0.3,
  },

  controlButtonText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "600",
  },

  videoPosition: {
    flex: 1,
    color: COLORS.mutedDark,
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },

  contentHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 23,
    marginBottom: 13,
  },

  contentTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "800",
  },

  contentSubtitle: {
    color: COLORS.mutedDark,
    fontSize: 11,
    marginTop: 4,
  },

  contentCount: {
    minHeight: 32,
    paddingHorizontal: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.cyanSoft,
    borderWidth: 1,
    borderColor: COLORS.cyanBorder,
  },

  contentCountText: {
    color: COLORS.cyan,
    fontSize: 11,
    fontWeight: "800",
  },

  searchContainer: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 13,
    marginBottom: 13,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  searchInput: {
    flex: 1,
    height: 44,
    color: COLORS.text,
    fontSize: 13,
    paddingVertical: 0,
  },

  clearSearchButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  sectionCard: {
    overflow: "hidden",
    marginBottom: 10,
    borderRadius: 15,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  sectionHeader: {
    minHeight: 67,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },

  sectionHeaderPressed: {
    backgroundColor: COLORS.surfacePressed,
  },

  sectionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.cyanSoft,
    borderWidth: 1,
    borderColor: COLORS.cyanBorder,
  },

  sectionHeaderContent: {
    flex: 1,
    minWidth: 0,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },

  sectionMetadata: {
    color: COLORS.mutedDark,
    fontSize: 10,
    marginTop: 4,
  },

  sectionLectures: {
    paddingBottom: 5,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },

  videoRow: {
    minHeight: 61,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },

  videoRowActive: {
    backgroundColor: COLORS.cyanSoft,
  },

  videoRowPressed: {
    backgroundColor: COLORS.surfacePressed,
  },

  videoNumber: {
    width: 29,
    height: 29,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  videoNumberActive: {
    backgroundColor: COLORS.cyanSoft,
    borderColor: COLORS.cyanBorder,
  },

  videoNumberText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "700",
  },

  videoRowContent: {
    flex: 1,
    minWidth: 0,
  },

  videoRowTitle: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },

  videoRowTitleActive: {
    color: COLORS.cyan,
  },

  videoRowMetadata: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },

  videoRowDuration: {
    color: COLORS.mutedDark,
    fontSize: 9,
  },

  freeBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginLeft: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.25)",
  },

  freeBadgeText: {
    color: COLORS.green,
    fontSize: 8,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  noVideosText: {
    color: COLORS.mutedDark,
    fontSize: 11,
    fontStyle: "italic",
    paddingHorizontal: 51,
    paddingVertical: 13,
  },

  sectionLoading: {
    minHeight: 80,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 9,
  },

  sectionLoadingText: {
    color: COLORS.muted,
    fontSize: 12,
  },

  emptySections: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
  },

  emptySectionsTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 12,
  },

  emptySectionsText: {
    color: COLORS.muted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
  },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  errorIcon: {
    width: 70,
    height: 70,
    borderRadius: 23,
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
    marginTop: 16,
  },

  stateDescription: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
  },

  retryButton: {
    minHeight: 43,
    paddingHorizontal: 18,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 19,
    backgroundColor: COLORS.cyan,
  },

  retryButtonText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: "800",
  },

  pressed: {
    opacity: 0.7,
  },

  disabled: {
    opacity: 0.45,
  },
});
