import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    View
} from "react-native";

import { getCourseReviews } from "@/services/course-review.service";
import type { CourseReview } from "@/types/course-review";

const COLORS = {
  card: "rgba(255,255,255,0.045)",
  cardStrong: "rgba(6,12,32,0.55)",
  white: "#FFFFFF",
  text: "#E5E7EB",
  muted: "#9CA3AF",
  mutedDark: "#6B7280",
  cyan: "#33D6FF",
  yellow: "#FACC15",
  border: "rgba(255,255,255,0.09)",
  cyanBorder: "rgba(51,214,255,0.20)",
  yellowBorder: "rgba(250,204,21,0.20)",
};

const AVATAR_GRADIENTS = [
  ["#22D3EE", "#3B82F6"],
  ["#A78BFA", "#7C3AED"],
  ["#34D399", "#0D9488"],
  ["#FB923C", "#EC4899"],
  ["#FB7185", "#DC2626"],
  ["#FBBF24", "#F97316"],
] as const;

interface CourseReviewsProps {
  courseId: string | number;
}

function formatDate(dateValue: string): string {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitial(name?: string | null): string {
  const trimmedName = name?.trim();

  return trimmedName ? trimmedName.charAt(0).toUpperCase() : "S";
}

function StarRating({ rating, size = 15 }: { rating: number; size?: number }) {
  const normalizedRating = Math.max(
    0,
    Math.min(5, Math.round(Number(rating) || 0)),
  );

  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= normalizedRating ? "star" : "star-outline"}
          size={size}
          color={star <= normalizedRating ? COLORS.yellow : COLORS.mutedDark}
        />
      ))}
    </View>
  );
}

function ReviewSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      <View style={styles.skeletonHeader} />
      <View style={styles.skeletonSummary} />

      <View style={styles.skeletonCards}>
        <View style={styles.skeletonCard} />
        <View style={styles.skeletonCard} />
      </View>
    </View>
  );
}

function ReviewCard({
  review,
  index,
}: {
  review: CourseReview;
  index: number;
}) {
  const gradient = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];

  const studentName = review.user?.user_name?.trim() || "Student";

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewUserRow}>
        <View style={styles.studentIdentity}>
          <LinearGradient
            colors={[gradient[0], gradient[1]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{getInitial(studentName)}</Text>
          </LinearGradient>

          <View style={styles.studentDetails}>
            <Text numberOfLines={1} style={styles.studentName}>
              {studentName}
            </Text>

            <View style={styles.dateRow}>
              <Ionicons
                name="calendar-outline"
                size={12}
                color={COLORS.mutedDark}
              />

              <Text style={styles.reviewDate}>
                {formatDate(review.created_at)}
              </Text>
            </View>
          </View>
        </View>

        <StarRating rating={review.rating} size={13} />
      </View>

      <View style={styles.reviewTextBox}>
        <View style={styles.reviewLabel}>
          <Ionicons
            name="chatbox-ellipses-outline"
            size={14}
            color={COLORS.cyan}
          />

          <Text style={styles.reviewLabelText}>Review</Text>
        </View>

        <Text numberOfLines={6} style={styles.reviewText}>
          {review.review_text?.trim() || "No review text provided."}
        </Text>
      </View>
    </View>
  );
}

export default function CourseReviews({ courseId }: CourseReviewsProps) {
  const {
    data: reviews = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["course-reviews", String(courseId)],

    queryFn: () => getCourseReviews(courseId),

    enabled: Boolean(courseId),

    staleTime: 10 * 60 * 1000,

    retry: 2,
  });

  const averageRating = useMemo(() => {
    if (reviews.length === 0) {
      return 0;
    }

    const totalRating = reviews.reduce(
      (total, review) => total + Number(review.rating || 0),
      0,
    );

    return Number((totalRating / reviews.length).toFixed(1));
  }, [reviews]);

  const ratingDistribution = useMemo(() => {
    const distribution: Record<number, number> = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    reviews.forEach((review) => {
      const rating = Math.round(Number(review.rating || 0));

      if (rating >= 1 && rating <= 5) {
        distribution[rating] += 1;
      }
    });

    return distribution;
  }, [reviews]);

  if (isLoading) {
    return <ReviewSkeleton />;
  }

  if (isError || reviews.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={styles.feedbackBadge}>
          <Ionicons name="chatbubbles-outline" size={14} color={COLORS.cyan} />

          <Text style={styles.feedbackBadgeText}>Student Feedback</Text>
        </View>

        <Text style={styles.sectionTitle}>What students are saying</Text>

        <Text style={styles.sectionSubtitle}>
          {reviews.length} {reviews.length === 1 ? "review" : "reviews"} for
          this course
        </Text>
      </View>

      <View style={styles.ratingSummary}>
        <View style={styles.averageSection}>
          <Text style={styles.averageRating}>{averageRating.toFixed(1)}</Text>

          <View>
            <StarRating rating={Math.round(averageRating)} />

            <Text style={styles.ratingLabel}>Course Rating</Text>
          </View>
        </View>

        <View style={styles.distribution}>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingDistribution[star] || 0;

            const percentage =
              reviews.length > 0
                ? Math.round((count / reviews.length) * 100)
                : 0;

            return (
              <View key={star} style={styles.distributionRow}>
                <Text style={styles.starNumber}>{star}</Text>

                <Ionicons name="star" size={11} color={COLORS.yellow} />

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressValue,
                      {
                        width: `${percentage}%`,
                      },
                    ]}
                  />
                </View>

                <Text style={styles.percentage}>{percentage}%</Text>
              </View>
            );
          })}
        </View>
      </View>

      <FlatList
        horizontal
        data={reviews}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item, index }) => (
          <ReviewCard review={item} index={index} />
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.reviewList}
        snapToInterval={300}
        decelerationRate="fast"
        nestedScrollEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },

  sectionHeader: {
    paddingHorizontal: 18,
  },

  feedbackBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(51,214,255,0.09)",
    borderWidth: 1,
    borderColor: COLORS.cyanBorder,
  },

  feedbackBadgeText: {
    color: COLORS.cyan,
    fontSize: 10,
    fontWeight: "800",
  },

  sectionTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 13,
  },

  sectionSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 5,
  },

  ratingSummary: {
    marginHorizontal: 18,
    marginTop: 17,
    padding: 15,
    borderRadius: 17,
    backgroundColor: "rgba(250,204,21,0.045)",
    borderWidth: 1,
    borderColor: COLORS.yellowBorder,
  },

  averageSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    marginBottom: 14,
  },

  averageRating: {
    color: "#FDE68A",
    fontSize: 38,
    fontWeight: "900",
    lineHeight: 42,
  },

  stars: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },

  ratingLabel: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 5,
  },

  distribution: {
    gap: 6,
  },

  distributionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  starNumber: {
    width: 10,
    color: COLORS.muted,
    fontSize: 10,
    textAlign: "right",
  },

  progressTrack: {
    flex: 1,
    height: 5,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  progressValue: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: COLORS.yellow,
  },

  percentage: {
    width: 30,
    color: COLORS.muted,
    fontSize: 9,
    textAlign: "right",
  },

  reviewList: {
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 17,
  },

  reviewCard: {
    width: 288,
    padding: 15,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  reviewUserRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },

  studentIdentity: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "900",
  },

  studentDetails: {
    flex: 1,
    minWidth: 0,
  },

  studentName: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "800",
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },

  reviewDate: {
    color: COLORS.mutedDark,
    fontSize: 9,
  },

  reviewTextBox: {
    padding: 13,
    marginTop: 14,
    borderRadius: 13,
    backgroundColor: COLORS.cardStrong,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  reviewLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 8,
  },

  reviewLabelText: {
    color: COLORS.cyan,
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },

  reviewText: {
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 19,
  },

  skeletonContainer: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  skeletonHeader: {
    width: 170,
    height: 20,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  skeletonSummary: {
    width: "100%",
    height: 135,
    borderRadius: 17,
    marginTop: 17,
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  skeletonCards: {
    flexDirection: "row",
    gap: 12,
    marginTop: 17,
  },

  skeletonCard: {
    width: 210,
    height: 170,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.055)",
  },
});
