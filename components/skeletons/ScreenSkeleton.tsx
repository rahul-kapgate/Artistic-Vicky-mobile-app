import type { ReactNode } from "react";
import {
    ScrollView,
    StyleProp,
    StyleSheet,
    useWindowDimensions,
    View,
    ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ScreenSkeletonProps {
  children: ReactNode;
  scrollable?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

export function ScreenSkeleton({
  children,
  scrollable = true,
  contentStyle,
}: ScreenSkeletonProps) {
  const { width } = useWindowDimensions();

  const isTablet = width >= 768;
  const horizontalPadding = isTablet ? 28 : width < 360 ? 14 : 18;

  const content = (
    <View
      style={[
        styles.content,
        {
          paddingHorizontal: horizontalPadding,
          maxWidth: isTablet ? 820 : undefined,
        },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {scrollable ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#050A1C",
  },

  scrollContent: {
    flexGrow: 1,
  },

  content: {
    width: "100%",
    alignSelf: "center",
    paddingBottom: 30,
  },
});
