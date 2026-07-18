import { StyleSheet, View } from "react-native";

import { ScreenSkeleton } from "./ScreenSkeleton";
import { SkeletonBox } from "./SkeletonBox";

export function TestScreenSkeleton() {
  return (
    <ScreenSkeleton scrollable={false} contentStyle={styles.screen}>
      <View style={styles.header}>
        <SkeletonBox width={42} height={42} borderRadius={13} />

        <View style={styles.headerCenter}>
          <SkeletonBox width={120} height={16} borderRadius={7} />

          <SkeletonBox
            width={90}
            height={10}
            borderRadius={5}
            style={styles.headerSubtitle}
          />
        </View>

        <SkeletonBox width={42} height={42} borderRadius={13} />
      </View>

      <View style={styles.metaRow}>
        <SkeletonBox width={112} height={38} borderRadius={12} />

        <SkeletonBox width={78} height={12} borderRadius={6} />
      </View>

      <SkeletonBox width="100%" height={4} borderRadius={2} />

      <View style={styles.questionArea}>
        <View style={styles.questionCard}>
          <View style={styles.questionTop}>
            <SkeletonBox width={32} height={14} borderRadius={6} />

            <SkeletonBox width={62} height={22} borderRadius={8} />
          </View>

          <SkeletonBox width="96%" height={18} borderRadius={7} />

          <SkeletonBox
            width="84%"
            height={18}
            borderRadius={7}
            style={styles.questionLine}
          />

          <View style={styles.options}>
            {[1, 2, 3, 4].map((item) => (
              <View key={item} style={styles.option}>
                <SkeletonBox width={36} height={36} borderRadius={11} />

                <SkeletonBox width="75%" height={14} borderRadius={7} />
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <SkeletonBox width="36%" height={46} borderRadius={14} />

        <SkeletonBox width={40} height={12} borderRadius={6} />

        <SkeletonBox width="36%" height={46} borderRadius={14} />
      </View>
    </ScreenSkeleton>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  header: {
    minHeight: 68,
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

  metaRow: {
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  questionArea: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 16,
  },

  questionCard: {
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    backgroundColor: "rgba(255,255,255,0.025)",
  },

  questionTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  questionLine: {
    marginTop: 10,
  },

  options: {
    gap: 11,
    marginTop: 24,
  },

  option: {
    minHeight: 64,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  footer: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
});
