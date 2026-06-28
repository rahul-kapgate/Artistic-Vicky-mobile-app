import { getCourseById } from "@/services/course.service";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    ActivityIndicator,
    Dimensions,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function CourseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: course, isLoading } = useQuery({
    queryKey: ["course", id],
    queryFn: () => getCourseById(id),
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#4CC3FF" />
      </SafeAreaView>
    );
  }

  if (!course) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={{ color: "#fff", fontSize: 18 }}>Course not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Hero Section */}

        <View style={styles.heroContainer}>
          <Image source={{ uri: course.image }} style={styles.heroImage} />

          <LinearGradient
            colors={["transparent", "rgba(5,10,28,0.95)"]}
            style={styles.overlay}
          />

          {/* Back Button */}

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          {/* Price Badge */}

          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>₹ {course.price}</Text>
          </View>

          {/* Title */}

          <View style={styles.titleContainer}>
            <Text style={styles.title}>{course.course_name}</Text>
          </View>
        </View>

        {/* Content */}

        <View style={styles.content}>
          {/* Info Cards */}

          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Ionicons name="time-outline" size={24} color="#4CC3FF" />
              <Text style={styles.infoLabel}>Duration</Text>
              <Text style={styles.infoValue}>{course.duration}</Text>
            </View>

            <View style={styles.infoCard}>
              <Ionicons name="language-outline" size={24} color="#4CC3FF" />
              <Text style={styles.infoLabel}>Language</Text>
              <Text style={styles.infoValue}>{course.language}</Text>
            </View>

            <View style={styles.infoCard}>
              <Ionicons name="star" size={24} color="#FFD700" />
              <Text style={styles.infoLabel}>Rating</Text>
              <Text style={styles.infoValue}>{course.rating}</Text>
            </View>

            <View style={styles.infoCard}>
              <MaterialCommunityIcons
                name="shape-outline"
                size={24}
                color="#4CC3FF"
              />
              <Text style={styles.infoLabel}>Category</Text>
              <Text style={styles.infoValue}>{course.category}</Text>
            </View>
          </View>

          {/* Description */}

          <View style={styles.card}>
            <Text style={styles.heading}>About this Course</Text>

            <Text style={styles.description}>{course.description}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_WIDTH = (width - 52) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050A1C",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#050A1C",
  },

  heroContainer: {
    height: 310,
    position: "relative",
  },

  heroImage: {
    width: "100%",
    height: "100%",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
  },

  backButton: {
    position: "absolute",
    top: 18,
    left: 18,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },

  priceBadge: {
    position: "absolute",
    top: 18,
    right: 18,
    backgroundColor: "#2eca2e",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },

  priceText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  titleContainer: {
    position: "absolute",
    bottom: 25,
    left: 20,
    right: 20,
  },

  title: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "700",
  },

  content: {
    paddingHorizontal: 18,
    marginTop: 22,
  },

  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  infoCard: {
    width: CARD_WIDTH,
    backgroundColor: "#0F172A",
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1E293B",
  },

  infoLabel: {
    color: "#94A3B8",
    marginTop: 10,
    fontSize: 13,
  },

  infoValue: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 6,
    textAlign: "center",
  },

  card: {
    backgroundColor: "#0F172A",
    borderRadius: 22,
    padding: 22,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#1E293B",
  },

  heading: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 15,
  },

  description: {
    color: "#CBD5E1",
    fontSize: 16,
    lineHeight: 28,
  },
});
