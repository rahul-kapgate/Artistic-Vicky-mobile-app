import { StyleSheet, View } from "react-native";

import { ScreenSkeleton } from "./ScreenSkeleton";
import { SkeletonBox } from "./SkeletonBox";

interface TestListSkeletonProps {
  cardCount?: number;
  grouped?: boolean;
}

export function TestListSkeleton({
  cardCount = 5,
  grouped = false,
}: TestListSkeletonProps) {
  return (
    <ScreenSkeleton>
      <View style={styles.header}>
        <SkeletonBox width={44} height={44} borderRadius={14} />

        <View style={styles.headerCenter}>
          <SkeletonBox width={150} height={17} borderRadius={7} />

          <SkeletonBox
            width={110}
            height={10}
            borderRadius={5}
            style={styles.headerSubtitle}
          />
        </View>

        <SkeletonBox width={44} height={44} borderRadius={14} />
      </View>

      <View style={styles.hero}>
        <SkeletonBox width={54} height={54} borderRadius={18} />

        <View style={styles.heroContent}>
          <SkeletonBox width="65%" height={17} borderRadius={7} />

          <SkeletonBox
            width="92%"
            height={12}
            borderRadius={6}
            style={styles.heroText}
          />

          <SkeletonBox
            width="72%"
            height={12}
            borderRadius={6}
            style={styles.heroText}
          />
        </View>
      </View>

      {Array.from({ length: cardCount }).map((_, index) => (
        <View key={index}>
          {grouped && (index === 0 || index === 2 || index === 4) ? (
            <View style={styles.yearRow}>
              <SkeletonBox width={52} height={16} borderRadius={7} />

              <SkeletonBox width="65%" height={1} borderRadius={1} />
            </View>
          ) : null}

          <View style={styles.card}>
            <SkeletonBox width={48} height={48} borderRadius={15} />

            <View style={styles.cardContent}>
              <SkeletonBox width="75%" height={15} borderRadius={7} />

              <View style={styles.metaRow}>
                <SkeletonBox width={85} height={11} borderRadius={5} />

                <SkeletonBox width={60} height={11} borderRadius={5} />
              </View>
            </View>

            <SkeletonBox width={62} height={36} borderRadius={11} />
          </View>
        </View>
      ))}
    </ScreenSkeleton>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
  },

  headerCenter: {
    flex: 1,
    alignItems: "center",
  },

  headerSubtitle: {
    marginTop: 6,
  },

  hero: {
    padding: 18,
    marginBottom: 14,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  heroContent: {
    flex: 1,
  },

  heroText: {
    marginTop: 8,
  },

  yearRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 17,
    marginBottom: 9,
  },

  card: {
    minHeight: 82,
    padding: 13,
    marginBottom: 10,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  cardContent: {
    flex: 1,
  },

  metaRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 9,
  },
});
