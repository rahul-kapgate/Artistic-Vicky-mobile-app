import { StyleSheet, View } from "react-native";

import { ScreenSkeleton } from "./ScreenSkeleton";
import { SkeletonBox } from "./SkeletonBox";

export function CourseDashboardSkeleton() {
  return (
    <ScreenSkeleton>
      <View style={styles.header}>
        <SkeletonBox width={46} height={46} borderRadius={23} />

        <SkeletonBox width={140} height={17} borderRadius={7} />

        <View style={styles.spacer} />
      </View>

      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <SkeletonBox width={54} height={54} borderRadius={18} />

          <SkeletonBox width={90} height={32} borderRadius={999} />
        </View>

        <SkeletonBox width="70%" height={29} borderRadius={10} />

        <SkeletonBox
          width="95%"
          height={14}
          borderRadius={7}
          style={styles.description}
        />

        <SkeletonBox
          width="80%"
          height={14}
          borderRadius={7}
          style={styles.descriptionLine}
        />

        <SkeletonBox
          width="100%"
          height={70}
          borderRadius={18}
          style={styles.stats}
        />
      </View>

      <SkeletonBox width={190} height={24} borderRadius={9} />

      <SkeletonBox
        width={230}
        height={13}
        borderRadius={7}
        style={styles.sectionSubtitle}
      />

      <View style={styles.sections}>
        {[1, 2, 3, 4].map((item) => (
          <View key={item} style={styles.sectionCard}>
            <SkeletonBox width={52} height={52} borderRadius={17} />

            <View style={styles.sectionContent}>
              <SkeletonBox width="55%" height={17} borderRadius={7} />

              <SkeletonBox
                width="85%"
                height={12}
                borderRadius={6}
                style={styles.sectionDescription}
              />
            </View>

            <SkeletonBox width={24} height={24} borderRadius={12} />
          </View>
        ))}
      </View>
    </ScreenSkeleton>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  spacer: {
    width: 46,
  },

  hero: {
    padding: 22,
    marginBottom: 28,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  description: {
    marginTop: 17,
  },

  descriptionLine: {
    marginTop: 8,
  },

  stats: {
    marginTop: 22,
  },

  sectionSubtitle: {
    marginTop: 8,
  },

  sections: {
    gap: 16,
    marginTop: 18,
  },

  sectionCard: {
    minHeight: 94,
    padding: 16,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  sectionContent: {
    flex: 1,
  },

  sectionDescription: {
    marginTop: 9,
  },
});
